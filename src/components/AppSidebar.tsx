
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Menu, X, Laptop, Calendar, Users, 
  PlusCircle, ShoppingCart, Wrench, PackageOpen, 
  LogOut, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
  expanded: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active, expanded }: SidebarItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 group hover:bg-white/10",
        active ? "bg-white/10 text-eccos-green" : "text-white"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span 
        className={cn(
          "transition-all duration-300", 
          expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}
      >
        {label}
      </span>
    </Link>
  );
};

interface SidebarSubMenuProps {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  expanded: boolean;
}

const SidebarSubMenu = ({ label, icon: Icon, children, expanded }: SidebarSubMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors text-white hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" />
          <span 
            className={cn(
              "transition-all duration-300", 
              expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            {label}
          </span>
        </div>
        {expanded && (
          isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        )}
      </button>
      <div 
        className={cn(
          "space-y-1 pl-8 transition-all duration-300",
          isOpen && expanded ? "block" : "hidden"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const AppSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { currentUser, isAdmin, signOut } = useAuth();
  
  const userMenuItems = [
    { icon: Home, label: "Página Inicial", href: "/" },
    { 
      icon: PlusCircle,
      label: "Nova Solicitação",
      items: [
        { label: "Reserva", href: "/nova-solicitacao/reserva" },
        { label: "Compra", href: "/nova-solicitacao/compra" },
        { label: "Suporte", href: "/nova-solicitacao/suporte" },
      ]
    },
  ];
  
  const adminMenuItems = [
    { icon: Laptop, label: "Equipamentos", href: "/equipamentos" },
    { icon: Calendar, label: "Disponibilidade", href: "/disponibilidade" },
    { icon: Users, label: "Usuários", href: "/usuarios" },
    { icon: PackageOpen, label: "Inventário", href: "/inventario" },
  ];

  return (
    <div
      className={cn(
        "h-screen bg-background border-r border-border flex flex-col transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-4 h-16">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/logo.png" 
            alt="ECCOS"
            className="h-8 w-8"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://via.placeholder.com/40/0074E0/FFFFFF?text=E";
            }}
          />
          <span 
            className={cn(
              "text-xl font-bold text-white transition-all duration-300",
              expanded ? "opacity-100" : "opacity-0 w-0"
            )}
          >
            ECCOS
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setExpanded(!expanded)} 
          className="text-white hover:bg-white/10"
        >
          {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scrollbar-none">
        {userMenuItems.map((item, index) => {
          if ('items' in item) {
            return (
              <SidebarSubMenu 
                key={index} 
                label={item.label} 
                icon={item.icon} 
                expanded={expanded}
              >
                {item.items.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.href}
                    className={cn(
                      "block py-2 px-3 rounded-md transition-colors",
                      location.pathname === subItem.href 
                        ? "text-eccos-green" 
                        : "text-white/70 hover:text-white"
                    )}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </SidebarSubMenu>
            );
          } else {
            return (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={location.pathname === item.href}
                expanded={expanded}
              />
            );
          }
        })}

        {isAdmin && (
          <>
            <div className="h-px bg-border my-4"></div>
            <div 
              className={cn(
                "px-3 mb-2 text-xs uppercase text-muted-foreground font-semibold transition-all duration-300",
                expanded ? "opacity-100" : "opacity-0"
              )}
            >
              Administração
            </div>
            {adminMenuItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={location.pathname === item.href}
                expanded={expanded}
              />
            ))}
          </>
        )}
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "w-full flex items-center gap-3 hover:bg-white/10 p-2 rounded-md transition-all",
                expanded ? "" : "justify-center"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.photoURL || ""} />
                <AvatarFallback className="bg-eccos-blue">
                  {currentUser?.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {expanded && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">{currentUser?.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
