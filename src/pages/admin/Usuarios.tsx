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

const Usuarios = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const { data: users = [], refetch } = useQuery({
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
            Operacional
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

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
             <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="text-black" size={35} /> {/* Ícone adicionado */}
          Usuários
        </h1>
            <p className="text-muted-foreground">
              Administre os usuários do sistema - {users.length} registros encontrados
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden bg-background shadow-[rgba(0,0,0,0.10)_2px_2px_3px_0px] hover:shadow-[rgba(0,0,0,0.12)_4px_4px_5px_0px transition-all duration-300 relative border-0 border-l-4 border-blue-500 before:content-[''] before:absolute before:left-0 before:top-0 before:w-[2px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent before:opacity-30">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center align-middle w-[30%]">Nome</TableHead>
                <TableHead className="text-center align-middle w-[25%]">Email</TableHead>
                <TableHead className="text-center align-middle w-[20%]">Função</TableHead>
                <TableHead className="text-center align-middle w-[15%]">Último Acesso</TableHead>
                <TableHead className="text-center align-middle w-[10%]">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.uid}
                  className="group transition-all duration-200 hover:bg-secondary/10"
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
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditRole(user) && (
                            <DropdownMenuItem
                              onClick={() => handleRoleChangeClick(user)}
                              className="cursor-pointer"
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
                                user.blocked ? "text-green-600" : "text-red-600"
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
              ))}
              
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={5} 
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
      </div>
    </AppLayout>
  );
};

export default Usuarios;