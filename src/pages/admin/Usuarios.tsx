
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
import { Search, ShieldCheck, UserPlus, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

// Mock data for users
const MOCK_USERS = [
  { 
    id: 1, 
    name: "Ana Silva", 
    email: "ana.silva@colegioeccos.com.br", 
    role: "admin", 
    department: "TI", 
    lastActive: "Hoje, 10:25", 
    avatar: null
  },
  { 
    id: 2, 
    name: "João Oliveira", 
    email: "joao.oliveira@colegioeccos.com.br", 
    role: "user", 
    department: "Matemática", 
    lastActive: "Hoje, 09:15", 
    avatar: null
  },
  { 
    id: 3, 
    name: "Mariana Costa", 
    email: "mariana.costa@colegioeccos.com.br", 
    role: "user", 
    department: "História", 
    lastActive: "Ontem", 
    avatar: null
  },
  { 
    id: 4, 
    name: "Carlos Reis", 
    email: "carlos.reis@colegioeccos.com.br", 
    role: "user", 
    department: "Ciências", 
    lastActive: "Há 3 dias", 
    avatar: null
  },
  { 
    id: 5, 
    name: "Suporte ECCOS", 
    email: "suporte@colegioeccos.com.br", 
    role: "superadmin", 
    department: "TI", 
    lastActive: "Agora", 
    avatar: null
  },
  { 
    id: 6, 
    name: "Paula Mendes", 
    email: "paula.mendes@colegioeccos.com.br", 
    role: "admin", 
    department: "Direção", 
    lastActive: "Há 1 hora", 
    avatar: null
  },
];

const Usuarios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(MOCK_USERS);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredUsers(MOCK_USERS);
    } else {
      const filtered = MOCK_USERS.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.department.toLowerCase().includes(term) ||
          user.role.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
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
            <Button className="bg-eccos-purple hover:bg-eccos-purple/80">
              <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Lista de Usuários</CardTitle>
              <CardDescription>
                Todos os usuários cadastrados na plataforma ECCOS.
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
                      <TableRow key={user.id} className="hover:bg-secondary/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-eccos-blue to-eccos-purple text-white">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.lastActive}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={user.role === "superadmin"}
                            >
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

export default Usuarios;
