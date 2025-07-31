import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";
import {
  Trash,
  Plus,
  Save,
  Edit,
  Loader2,
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
  X,
  Shield,
  Settings,
  UserCheck
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: { [key: string]: boolean };
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
  "compras-infraestrutura": {
      label: "Compras Infraestrutura",
      icon: <ShoppingCart className="h-4 w-4" />,
      category: "Operacional"
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
    "user-dropdown": {
    label: "Dropdown de Usuários",
    icon: <Users className="h-4 w-4" />,
    category: "Administração"
  },
};
const defaultPermissions = Object.keys(permissionLabels);

const defaultInitialRoles: Role[] = [
  {
    id: "admin",
    name: "Administrador",
    description: "Acesso administrativo total",
    permissions: {
      dashboard: true,
      userdashboard: false,
      equipamentos: true,
      disponibilidade: true,
      estoque: true,
      usuarios: true,
      solicitacoes: true,
      "user-solicitacoes": true,
      "nova-reserva": true,
      "nova-compra": true,
      "nova-suporte": true,
      notificacoes: true,
      "compras-financeiro": true,
      "compras-tecnologia": true,
      "suporte-operacional": true,
      "calendario-reservas": true,
      "suporte-plataforma": true,
      "roles-management": true,
      profile: true,
      "notice-board-edit": true,
    },
  },
  {
    id: "financeiro",
    name: "Financeiro",
    description: "Controle financeiro e compras",
    permissions: {
      dashboard: false,
      userdashboard: true,
      "compras-financeiro": true,
      "user-solicitacoes": true,
      notificacoes: true,
      profile: true,
    },
  },
  {
    id: "operacional",
    name: "Operacional",
    description: "Equipe de manutenção e suporte operacional",
    permissions: {
      dashboard: false,
      userdashboard: true,
      "suporte-operacional": true,
      equipamentos: true,
      estoque: true,
      "user-solicitacoes": true,
      notificacoes: true,
      profile: true,
    },
  },
  {
    id: "user",
    name: "Usuário Padrão",
    description: "Usuário básico com acesso limitado",
    permissions: {
      dashboard: false,
      userdashboard: true,
      "user-solicitacoes": true,
      "nova-reserva": true,
      "nova-compra": true,
      "nova-suporte": true,
      notificacoes: true,
      profile: true,
    },
  },
];

// Componente Modal com z-index corrigido
const RoleModal: React.FC<{
  role: Role | null;
  onClose: () => void;
  onSave: () => void;
  onTogglePermission: (perm: string) => void;
  onChange: (field: keyof Role, value: string) => void;
}> = ({ role, onClose, onSave, onTogglePermission, onChange }) => {
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

  const categoryColors = {
    'Administração': 'bg-red-50 border-red-200 text-red-800',
    'Geral': 'bg-blue-50 border-blue-200 text-blue-800',
    'Recursos': 'bg-green-50 border-green-200 text-green-800',
    'Ações': 'bg-purple-50 border-purple-200 text-purple-800',
    'Financeiro': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    'Operacional': 'bg-orange-50 border-orange-200 text-orange-800',
    'Técnico': 'bg-gray-50 border-gray-200 text-gray-800',
    'Outros': 'bg-slate-50 border-slate-200 text-slate-800'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

const RolesManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setTimeout(() => {
      setRoles(defaultInitialRoles);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (roleId: string) => {
    if (roleId === "superadmin") return alert("Não é possível excluir o superadmin");
    if (roleId === "admin") return alert("Não é possível excluir o role de administrador padrão");
    
    if (window.confirm(`Tem certeza que deseja excluir a role "${roles.find(r => r.id === roleId)?.name}"?`)) {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }
  };

  const handleSave = async () => {
    if (!editingRole) return;
    if (!editingRole.id.trim()) return alert("ID é obrigatório");
    if (!editingRole.name.trim()) return alert("Nome é obrigatório");

    const isEditing = roles.some(role => role.id === editingRole.id);
    
    if (isEditing) {
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id ? editingRole : role
      ));
    } else {
      setRoles(prev => [...prev, editingRole]);
    }

    setEditingRole(null);
    setIsModalOpen(false);
  };

  const handleTogglePermission = (perm: string) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      permissions: {
        ...editingRole.permissions,
        [perm]: !editingRole.permissions?.[perm],
      },
    });
  };

  const handleCreateNew = () => {
    setEditingRole({
      id: "",
      name: "",
      description: "",
      permissions: {
        dashboard: false,
        userdashboard: true,
        profile: true,
      },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole({ ...role });
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Role, value: string) => {
    if (!editingRole) return;
    setEditingRole({ ...editingRole, [field]: value });
  };

  const getRoleTypeColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': return 'bg-red-50 border-red-200 text-red-800';
      case 'financeiro': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'operacional': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'user': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-purple-50 border-purple-200 text-purple-800';
    }
  };

  const pageContent = (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-100 blur-3xl opacity-20"></div>
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-blue-100 blur-3xl opacity-20"></div>
      </div>

      <div className="relative space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <Shield className="text-purple-600" size={35} />
              Gerenciar Roles
            </h1>
            <p className="text-gray-600 mt-2">
              Configure permissões e controle de acesso do sistema
            </p>
          </div>
          <Button 
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all px-6"
          >
            <Plus className="mr-2 w-4 h-4" /> 
            Nova Role
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-20">
            <div className="text-center">
              <Loader2 className="animate-spin w-12 h-12 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando roles...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {roles.map((role) => {
              const activePermissions = Object.keys(role.permissions).filter(p => role.permissions[p]);
              
              return (
                <Card 
                  key={role.id} 
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-purple-200"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900">
                            {role.name}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 text-xs ${getRoleTypeColor(role.id)}`}
                          >
                            {role.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {role.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Permissões Ativas</span>
                        <Badge variant="outline" className="text-xs">
                          {activePermissions.length}/{Object.keys(permissionLabels).length}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {activePermissions.length > 0 ? (
                          activePermissions.map((permission) => (
                            <div
                              key={permission}
                              className="flex items-center gap-2 text-xs bg-gradient-to-r from-purple-50 to-blue-50 text-purple-800 px-3 py-2 rounded-lg border border-purple-100"
                            >
                              <span className="text-purple-600">
                                {permissionLabels[permission]?.icon}
                              </span>
                              <span className="font-medium">
                                {permissionLabels[permission]?.label || permission}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                            Nenhuma permissão ativa
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(role)}
                        className="flex-1 rounded-lg hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4 mr-1" /> 
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
                        disabled={role.id === "admin"}
                        className="flex-1 rounded-lg"
                      >
                        <Trash className="w-4 h-4 mr-1" /> 
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && editingRole && (
          <RoleModal
            role={editingRole}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            onTogglePermission={handleTogglePermission}
            onChange={handleInputChange}
          />
        )}
      </div>
    </div>
  );

  return (
    <AppLayout>
      {pageContent}
    </AppLayout>
  );
};

export default RolesManagement;