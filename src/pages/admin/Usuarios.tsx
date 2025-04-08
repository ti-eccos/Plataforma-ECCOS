
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, Edit, Lock, Unlock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { getAllUsers, User } from "@/services/userService";
import { RoleChangeDialog } from "@/components/admin/RoleChangeDialog";
import { BlockUserDialog } from "@/components/admin/BlockUserDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Usuarios = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  // Fetch users with React Query
  const { data: users = [], refetch } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers
  });

  // Handle search
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    
    if (term === "") {
      // Sort users: admins first, then users, all in alphabetical order
      const sortedUsers = [...users].sort((a, b) => {
        // Role priority order (superadmin > admin > user)
        const rolePriority = { 
          "superadmin": 0, 
          "admin": 1, 
          "user": 2 
        };
        
        // First sort by role priority
        const roleDiff = (rolePriority[a.role] ?? 3) - (rolePriority[b.role] ?? 3);
        if (roleDiff !== 0) return roleDiff;
        
        // Then sort alphabetically
        return a.displayName.localeCompare(b.displayName);
      });
      
      setFilteredUsers(sortedUsers);
    } else {
      // Filter and then sort
      const filtered = users.filter(
        (user) =>
          user.displayName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          (user.department && user.department.toLowerCase().includes(term)) ||
          user.role.toLowerCase().includes(term)
      );
      
      const sortedFiltered = [...filtered].sort((a, b) => {
        const rolePriority = { 
          "superadmin": 0, 
          "admin": 1, 
          "user": 2 
        };
        
        const roleDiff = (rolePriority[a.role] ?? 3) - (rolePriority[b.role] ?? 3);
        if (roleDiff !== 0) return roleDiff;
        
        return a.displayName.localeCompare(b.displayName);
      });
      
      setFilteredUsers(sortedFiltered);
    }
  }, [users, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRoleChangeClick = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleBlockClick = (user: User) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const getRoleBadge = (user: User) => {
    // Check if there's a pending role change request
    if (user.pendingRoleChange) {
      return (
        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
          <span className="animate-pulse">Pendente</span>
        </Badge>
      );
    }

    switch (user.role) {
      case "superadmin":
        return (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/30">
            <ShieldCheck className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
            Usuário
          </Badge>
        );
    }
  };

  // Can edit role if:
  // 1. Current user is superadmin (can edit anyone except other superadmins)
  // 2. Current user is admin and target is not admin or superadmin
  const canEditRole = (user: User): boolean => {
    // Can't edit self
    if (currentUser?.uid === user.uid) return false;
    
    // Superadmin can edit anyone except other superadmins
    if (isSuperAdmin && user.role !== "superadmin") return true;
    
    // Admin can promote regular users to admin
    if (currentUser?.role === "admin" && user.role === "user") return true;
    
    // Admin can request to demote other admins
    if (currentUser?.role === "admin" && user.role === "admin") return true;
    
    return false;
  };
  
  // Can block if:
  // 1. Current user is superadmin (can block anyone except other superadmins)
  // 2. Current user is admin and target is a regular user
  const canBlock = (user: User): boolean => {
    // Can't block self
    if (currentUser?.uid === user.uid) return false;
    
    // Superadmin can block anyone except other superadmins
    if (isSuperAdmin && user.role !== "superadmin") return true;
    
    // Admin can block regular users
    if (currentUser?.role === "admin" && user.role === "user") return true;
    
    return false;
  };
  
  const getLastActive = (lastActiveStr?: string) => {
    if (!lastActiveStr) return "Nunca";
    
    const lastActive = new Date(lastActiveStr);
    const now = new Date();
    
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `Há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 30) return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    
    // For older dates, return formatted date
    return lastActive.toLocaleDateString('pt-BR');
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
              <h2 className="text-3xl font-bold tracking-tight text-gradient">Usuários</h2>
              <p className="text-muted-foreground mt-1">
                Gerencie os usuários da plataforma ECCOS.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                Todos os usuários cadastrados na plataforma ECCOS.
                {users.length > 0 ? ` (${users.length} usuários)` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="max-w-md"
                />
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.uid} className={`hover:bg-secondary/30 ${user.blocked ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.photoURL || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-eccos-blue to-eccos-purple text-white">
                                {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{user.displayName}</span>
                              {user.blocked && (
                                <Badge variant="outline" className="ml-2 bg-red-500/20 text-red-500">
                                  Bloqueado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department || "Não definido"}</TableCell>
                        <TableCell>{getRoleBadge(user)}</TableCell>
                        <TableCell>{getLastActive(user.lastActive)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditRole(user) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRoleChangeClick(user)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                                  </DropdownMenuItem>
                                )}
                                
                                {/* If there's a pending role change and current user is not the requester */}
                                {user.pendingRoleChange && 
                                 user.pendingRoleChange.requestedBy !== currentUser?.uid && 
                                 currentUser?.role === "admin" && 
                                 !user.pendingRoleChange.approvals.includes(currentUser?.uid) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRoleChangeClick(user)}
                                    className="text-blue-600"
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Aprovar alteração
                                  </DropdownMenuItem>
                                )}
                                
                                {/* If this user has requested a role change */}
                                {user.pendingRoleChange && 
                                 user.pendingRoleChange.requestedBy === currentUser?.uid && (
                                  <DropdownMenuItem 
                                    onClick={() => handleRoleChangeClick(user)}
                                    className="text-yellow-600"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Cancelar solicitação
                                  </DropdownMenuItem>
                                )}
                                
                                {canBlock(user) && (
                                  <>
                                    {canEditRole(user) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem 
                                      onClick={() => handleBlockClick(user)}
                                      className={user.blocked ? "text-green-600" : "text-red-600"}
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
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
      
      {/* Role change dialog */}
      <RoleChangeDialog 
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={selectedUser}
        onSuccess={refetch}
      />
      
      {/* Block user dialog */}
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
