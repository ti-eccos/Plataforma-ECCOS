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
import { Search, ShieldCheck, Edit, Lock, Unlock, Users} from "lucide-react";
import { getAllUsers, User } from "@/services/userService";
import { RoleChangeDialog } from "@/components/admin/RoleChangeDialog";
import { BlockUserDialog } from "@/components/admin/BlockUserDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

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

  const handleRoleChangeClick = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
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

  // Animação de entrada (fade-up)
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

  const canEditRole = (user: User): boolean => {
    if (currentUser?.uid === user.uid) return false;
    if (isSuperAdmin && user.role !== "superadmin") return true;
    if (currentUser?.role === "admin" && ["user", "financeiro", "operacional", "admin"].includes(user.role)) return true;
    return false;
  };

  const canBlock = (user: User): boolean => {
    if (currentUser?.uid === user.uid) return false;
    if (isSuperAdmin && user.role !== "superadmin") return true;
    if (currentUser?.role === "admin" && ["user", "financeiro", "operacional"].includes(user.role)) return true;
    return false;
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

  const showActionsButton = (user: User): boolean => {
    return user.role !== "superadmin";
  };

  // Calcular estatísticas de usuários
  const activeUsers = users.filter(user => !user.blocked).length;
  const blockedUsers = users.filter(user => user.blocked).length;
  const adminUsers = users.filter(user => ["admin", "superadmin"].includes(user.role)).length;
  const operationalUsers = users.filter(user => user.role === "operacional").length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-white overflow-hidden relative">
        {/* Fundos decorativos */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sidebar blur-3xl opacity-5"></div>
          <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-eccos-purple blur-3xl opacity-5"></div>
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-10 space-y-8 p-6 md:p-12 fade-up">
          <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
            <Users className="text-eccos-purple" size={35} />
            Gestão de Usuários
          </h1>

          <div className="space-y-8 fade-up">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
              {/* Card Usuários Ativos */}
              <Card
                className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="pb-2 p-6">
                  <h3 className="text-sm font-medium text-gray-600">
                    Usuários Ativos
                  </h3>
                </div>
                <div className="px-6 pb-6">
                  <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {activeUsers}
                  </div>
                  <Badge variant="outline" className="mt-2 border-eccos-purple text-eccos-purple">
                    Contas
                  </Badge>
                </div>
              </Card>

              {/* Card Usuários Bloqueados */}
              <Card
                className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="pb-2 p-6">
                  <h3 className="text-sm font-medium text-gray-600">
                    Usuários Bloqueados
                  </h3>
                </div>
                <div className="px-6 pb-6">
                  <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {blockedUsers}
                  </div>
                  <Badge variant="outline" className="mt-2 border-red-500 text-red-500">
                    Restrito
                  </Badge>
                </div>
              </Card>

              {/* Card Administradores */}
              <Card
                className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="pb-2 p-6">
                  <h3 className="text-sm font-medium text-gray-600">
                    Administradores
                  </h3>
                </div>
                <div className="px-6 pb-6">
                  <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {adminUsers}
                  </div>
                  <Badge variant="outline" className="mt-2 border-blue-500 text-blue-500">
                    Gestão
                  </Badge>
                </div>
              </Card>

              {/* Card Operacionais */}
              <Card
                className="bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="pb-2 p-6">
                  <h3 className="text-sm font-medium text-gray-600">
                    Operacionais
                  </h3>
                </div>
                <div className="px-6 pb-6">
                  <div className="text-2xl font-bold bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text text-transparent">
                    {operationalUsers}
                  </div>
                  <Badge variant="outline" className="mt-2 border-orange-500 text-orange-500">
                    Suporte
                  </Badge>
                </div>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 fade-up">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-eccos-purple focus:ring-eccos-purple focus:border-eccos-purple"
                />
              </div>
              <p className="text-muted-foreground">
                {users.length} registros encontrados
              </p>
            </div>

            <div className="rounded-2xl border-0 overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 fade-up">
              <div className="border-l-4 border-eccos-purple">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-center align-middle w-[30%] font-medium text-gray-700">Nome</TableHead>
                      <TableHead className="text-center align-middle w-[25%] font-medium text-gray-700">Email</TableHead>
                      <TableHead className="text-center align-middle w-[20%] font-medium text-gray-700">Função</TableHead>
                      <TableHead className="text-center align-middle w-[15%] font-medium text-gray-700">Último Acesso</TableHead>
                      <TableHead className="text-center align-middle w-[10%] font-medium text-gray-700">Ações</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-eccos-purple"></div>
                            <span className="text-muted-foreground">Carregando usuários...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell 
                          colSpan={5} 
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
                          <TableCell className="text-center align-middle">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{user.displayName}</span>
                              {user.blocked && (
                                <Badge variant="destructive" className="mt-1">
                                  Bloqueado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-center align-middle">{user.email}</TableCell>
                          
                          <TableCell className="text-center align-middle">
                            {getRoleBadge(user)}
                          </TableCell>
                          
                          <TableCell className="text-center align-middle">
                            {getLastActive(user.lastActive)}
                          </TableCell>
                          
                          <TableCell className="text-center align-middle">
                            {showActionsButton(user) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-eccos-purple/10 hover:text-eccos-purple"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border border-gray-100 shadow-lg">
                                  {canEditRole(user) && (
                                    <DropdownMenuItem
                                      onClick={() => handleRoleChangeClick(user)}
                                      className="cursor-pointer hover:bg-eccos-purple/10"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Alterar Função
                                    </DropdownMenuItem>
                                  )}
                                  {canBlock(user) && (
                                    <DropdownMenuItem
                                      onClick={() => handleBlockClick(user)}
                                      className={cn(
                                        "cursor-pointer",
                                        user.blocked ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"
                                      )}
                                    >
                                      {user.blocked ? (
                                        <>
                                          <Unlock className="mr-2 h-4 w-4" />
                                          Desbloquear
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="mr-2 h-4 w-4" />
                                          Bloquear
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <footer className="relative z-10 bg-gray-50 py-10 px-4 md:px-12 mt-12 fade-up rounded-lg">
            <div className="max-w-6xl mx-auto">
              <div className="text-center">
                <p className="text-gray-500 text-sm">
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
        onSuccess={refetch}
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