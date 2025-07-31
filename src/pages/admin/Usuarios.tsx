import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, Edit, Lock, Unlock, Users, Eye, Mail, Calendar, Shield, User as UserIcon } from "lucide-react";
import { getAllUsers, User } from "@/services/userService";
import { RoleChangeDialog } from "@/components/admin/RoleChangeDialog";
import { BlockUserDialog } from "@/components/admin/BlockUserDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const UserDetailsDialog = ({ user, onRoleChange, onBlock }: { 
  user: User, 
  onRoleChange: (user: User) => void,
  onBlock: (user: User) => void 
}) => {
  const { currentUser, isSuperAdmin } = useAuth();

  const getRoleBadge = (user: User) => {
    if (user.pendingRoleChange) {
      return (
        <Badge className="bg-yellow-500 text-foreground">
          <span className="animate-pulse">Pendente</span>
        </Badge>
      );
    }
    switch (user.role) {
      case "superadmin":
        return (
          <Badge className="bg-purple-500 text-foreground">
            <ShieldCheck className="mr-1 h-4 w-4" />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500 text-foreground">
            Admin
          </Badge>
        );
      case "financeiro":
        return (
          <Badge className="bg-green-500 text-foreground">
            Financeiro
          </Badge>
        );
      case "operacional":
        return (
          <Badge className="bg-orange-500 text-foreground">
            Manutenção
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Usuário
          </Badge>
        );
    }
  };

  const getLastActive = (isoDate: string | null): string => {
    if (!isoDate) return "Nunca acessou";
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canEditRole = (user: User): boolean => {
    if (user.email === "suporte@colegioeccos.com.br") return false;
    if (currentUser?.uid === user.uid) return false;
    if (isSuperAdmin) return true;
    return false;
  };

  const canBlock = (user: User): boolean => {
    if (currentUser?.uid === user.uid) return false;
    if (isSuperAdmin && user.role !== "superadmin") return true;
    if (currentUser?.role === "admin" && ["user", "financeiro", "operacional"].includes(user.role)) return true;
    return false;
  };

  return (
    <DialogContent 
      className="max-w-md max-h-screen rounded-lg sm:rounded-xl p-0 overflow-hidden"
    >
      <div className="flex flex-col h-[90vh] sm:h-[85vh]">
        <DialogHeader className="shrink-0 sticky top-0 bg-white z-10 border-b">
          <DialogTitle className="flex items-center gap-2 p-4">
            <UserIcon className="h-5 w-5 text-eccos-purple" />
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription className="px-4 pb-2">
            Informações detalhadas sobre o usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Nome</p>
                <p className="text-sm text-gray-900">{user.displayName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Função</p>
                <div className="mt-1">
                  {getRoleBadge(user)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Último Acesso</p>
                <p className="text-sm text-gray-900">{getLastActive(user.lastActive)}</p>
              </div>
            </div>
          </div>

          {user.blocked && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Usuário Bloqueado</span>
              </div>
              <p className="text-xs text-red-600 mt-1">Este usuário não pode acessar o sistema</p>
            </div>
          )}

          {user.role !== "superadmin" && (
            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700">Ações</p>
              <div className="flex flex-col gap-2">
                {canEditRole(user) && (
                  <Button
                    variant="outline"
                    onClick={() => onRoleChange(user)}
                    className="justify-start h-9"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Alterar Função
                  </Button>
                )}
                {canBlock(user) && (
                  <Button
                    variant="outline"
                    onClick={() => onBlock(user)}
                    className={cn(
                      "justify-start h-9",
                      user.blocked ? "text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300" : "text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    )}
                  >
                    {user.blocked ? (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Desbloquear Usuário
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Bloquear Usuário
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

const Usuarios = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const { data: users = [], refetch, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  const handleRoleChangeClick = async (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
    // Forçar atualização das permissões
    await refetch();
    // Disparar evento para atualizar a sidebar
    window.dispatchEvent(new CustomEvent('userRoleChanged'));
  };

  const handleBlockClick = (user: User) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const sortedUsers = users
      .filter(user => term === "" ? true : 
        user.displayName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        const rolePriority = { 
          "superadmin": 0, 
          "admin": 1, 
          "financeiro": 2,
          "operacional": 3,
          "user": 4 
        };
        const roleDiff = (rolePriority[a.role] ?? 5) - (rolePriority[b.role] ?? 5);
        return roleDiff !== 0 ? roleDiff : a.displayName.localeCompare(b.displayName);
      });
    setFilteredUsers(sortedUsers);
  }, [users, searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const getRoleBadge = (user: User) => {
    if (user.pendingRoleChange) {
      return (
        <Badge className="bg-yellow-500 text-foreground">
          <span className="animate-pulse">Pendente</span>
        </Badge>
      );
    }
    switch (user.role) {
      case "superadmin":
        return (
          <Badge className="bg-purple-500 text-foreground">
            <ShieldCheck className="mr-1 h-4 w-4 hidden sm:inline-block" />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500 text-foreground">
            Admin
          </Badge>
        );
      case "financeiro":
        return (
          <Badge className="bg-green-500 text-foreground">
            Financeiro
          </Badge>
        );
      case "operacional":
        return (
          <Badge className="bg-orange-500 text-foreground">
            Manutenção
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Usuário
          </Badge>
        );
    }
  };

  const activeUsers = users.filter(user => !user.blocked).length;
  const blockedUsers = users.filter(user => user.blocked).length;
  const adminUsers = users.filter(user => ["admin", "superadmin"].includes(user.role)).length;
  const operationalUsers = users.filter(user => user.role === "operacional").length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>
        <div className="relative z-10 space-y-8 p-4 sm:p-6 md:p-12 fade-up">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Users className="text-eccos-purple" size={28} />
            <span className="hidden sm:inline">Gestão de Usuários</span>
            <span className="sm:hidden">Usuários</span>
          </h1>
          <div className="space-y-6 sm:space-y-8 fade-up">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
              <Card
                className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                    Usuários Ativos
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {activeUsers}
                  </div>
                  <Badge variant="outline" className="mt-1 sm:mt-2 border-eccos-purple text-eccos-purple text-xs">
                    Contas
                  </Badge>
                </div>
              </Card>
              <Card
                className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                    Usuários Bloqueados
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {blockedUsers}
                  </div>
                  <Badge variant="outline" className="mt-1 sm:mt-2 border-red-500 text-red-500 text-xs">
                    Restrito
                  </Badge>
                </div>
              </Card>
              <Card
                className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-3 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
                    Administradores
                  </h3>
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {adminUsers}
                  </div>
                  <Badge variant="outline" className="mt-1 sm:mt-2 border-blue-500 text-blue-500 text-xs">
                    Gestão
                  </Badge>
                </div>
              </Card>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 fade-up">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus-visible:ring-eccos-purple"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {users.length} registros encontrados
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl border-0 overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 fade-up">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-center align-middle font-medium text-gray-700 text-sm px-4">
                        Nome
                      </TableHead>
                      <TableHead className="text-center align-middle font-medium text-gray-700 text-sm px-4">
                        Função
                      </TableHead>
                      <TableHead className="text-center align-middle font-medium text-gray-700 text-sm px-4">
                        Detalhes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-eccos-purple"></div>
                            <span className="text-muted-foreground text-sm">Carregando usuários...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell 
                          colSpan={3} 
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user.uid}
                          className="group transition-all duration-200 hover:bg-gray-50 border-b border-gray-100"
                        >
                          <TableCell className="text-center align-middle px-4 py-4">
                            <div className="flex flex-col items-center space-y-2">
                              <span className="font-medium text-sm">{user.displayName}</span>
                              {user.blocked && (
                                <Badge variant="destructive" className="text-xs">
                                  Bloqueado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-middle px-4 py-4">
                            {getRoleBadge(user)}
                          </TableCell>
                          <TableCell className="text-center align-middle px-4 py-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:bg-eccos-purple/10 hover:text-eccos-purple hover:border-eccos-purple"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <UserDetailsDialog 
                                user={user} 
                                onRoleChange={handleRoleChangeClick}
                                onBlock={handleBlockClick}
                              />
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <footer className="relative z-10 bg-gray-50 py-6 sm:py-10 px-4 md:px-12 mt-8 sm:mt-12 fade-up rounded-lg">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                <p className="text-gray-500 text-xs sm:text-sm">
                  © 2025 Colégio ECCOS - Todos os direitos reservados
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <RoleChangeDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={selectedUser}
        onSuccess={() => {
          refetch();
          window.dispatchEvent(new CustomEvent('userRoleChanged'));
        }}
      />
      <BlockUserDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        user={selectedUser}
        onSuccess={refetch}
      />
    </AppLayout>
  );
};

export default Usuarios;