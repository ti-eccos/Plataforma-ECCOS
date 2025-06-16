import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, User as UserIcon, X } from 'lucide-react';
import { getAllUsers } from '@/services/userService';
import { User } from '@/services/userService';

interface UserDropdownProps {
  onSelectUser?: (user: User | null) => void;
  selectedUser?: User | null;
  onClearSelection?: () => void;
}

const UserDropdown = ({ 
  onSelectUser, 
  selectedUser,
  onClearSelection
}: UserDropdownProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersList = await getAllUsers();
        setUsers(usersList);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClearSelection) onClearSelection();
    if (onSelectUser) onSelectUser(null);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        {/* Botão principal do dropdown */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className={cn(
            "flex items-center justify-between w-full bg-white border border-gray-300 rounded-xl px-4 py-3",
            selectedUser ? "border-eccos-purple ring-1 ring-eccos-purple" : "hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <UserIcon size={18} className={cn(
              "flex-shrink-0",
              selectedUser ? "text-eccos-purple" : "text-gray-600"
            )} />
            
            <span className={cn(
              "truncate text-left",
              selectedUser ? "font-medium text-eccos-purple" : "text-gray-700"
            )}>
              {selectedUser ? selectedUser.displayName : "Selecionar solicitante"}
            </span>
          </div>
          
          <ChevronDown 
            size={16} 
            className={cn(
              "flex-shrink-0 transition-transform",
              selectedUser ? "text-eccos-purple" : "text-gray-500",
              isOpen ? "rotate-180" : ""
            )} 
          />
        </Button>
        
        {/* Botão de limpar seleção - posicionado à direita */}
        {selectedUser && (
          <button
            onClick={handleClearSelection}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 ml-auto"
            title="Limpar seleção"
          >
            <X size={18} className="text-gray-500 hover:text-red-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Carregando usuários...</div>
            ) : users.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">Nenhum usuário encontrado</div>
            ) : (
              <>
                <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b">
                  {selectedUser ? "Trocar usuário" : "Selecione um usuário"}
                </div>
                
                {users.map((user) => (
                  <button
                    key={user.uid}
                    onClick={() => {
                      if (onSelectUser) onSelectUser(user);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-sm text-left transition-colors",
                      "hover:bg-gray-50 focus:outline-none",
                      selectedUser?.uid === user.uid 
                        ? "bg-eccos-purple/10 text-eccos-purple font-medium" 
                        : "text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-eccos-purple flex-shrink-0"></div>
                      <span className="truncate">{user.displayName}</span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}