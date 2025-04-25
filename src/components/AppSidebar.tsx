import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, Laptop, Calendar, Users, 
  PlusCircle, LogOut, ChevronDown, 
  ChevronUp, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Logo from '@/images/logo-eccos.png';

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
        "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-300 group hover:bg-foreground/10 text-sm",
        active ? "bg-white text-eccos-blue" : "text-background"
      )}
      tabIndex={0}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("transition-all duration-300", expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>
        {label}
      </span>
    </Link>
  );
};

interface SubMenuItemProps {
  href: string;
  active: boolean;
  expanded: boolean;
  children: React.ReactNode;
}

const SubMenuItem = ({ href, active, expanded, children }: SubMenuItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300 group hover:bg-foreground/10",
        active ? "bg-white text-eccos-blue" : "text-background",
        !expanded && "justify-center"
      )}
    >
      <span 
        className={cn(
          "transition-all duration-300", 
          expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}
      >
        {children}
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
  const location = useLocation();

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors text-background hover:bg-foreground/10"
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
          "space-y-1 transition-all duration-300",
          isOpen && expanded ? "block" : "hidden"
        )}
      >
        {React.Children.map(children, child => 
          React.cloneElement(child as React.ReactElement, {
            active: location.pathname === (child as React.ReactElement).props.href,
            expanded
          })
        )}
      </div>
    </div>
  );
};

export const AppSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();
  
  const userMenuItems = [
    { icon: Home, label: "Página Inicial", href: "/" },
    { icon: FileText, label: "Minhas Solicitações", href: "/minhas-solicitacoes" },
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
    { icon: FileText, label: "Solicitações", href: "/solicitacoes" }
  ];

  return (
    <div
      className={cn(
        "h-screen bg-[hsl(var(--sidebar-background))] border-r border-border flex flex-col transition-all duration-300 z-10",
        expanded ? "w-64" : "w-16",
      )}
    >
      <div className="flex items-center justify-between p-1 h-24">
        <div className="flex items-center justify-center overflow-hidden px-4 py-0 w-full">
          <img 
            src={Logo} 
            alt="Logo ECCOS" 
            className={cn(
              "h-32 w-32 object-contain transition-all duration-300 shrink-0",
              expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          />
        </div>
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
                  <SubMenuItem
                    key={subIndex}
                    href={subItem.href}
                    active={location.pathname === subItem.href}
                    expanded={expanded}
                  >
                    {subItem.label}
                  </SubMenuItem>
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
                "px-3 mb-2 uppercase text-background font-semibold transition-all duration-300",
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

<div className="mt-auto pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={cn(
                  "w-full p-2 hover:bg-border rounded-md text-background transition-colors focus:outline-none flex items-center gap-2",
                  expanded ? "px-3 justify-start" : "justify-center"
                )}
                aria-label="Menu de logout"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {expanded && (
                  <span className="text-sm transition-all duration-300">
                    Sair
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align={expanded ? "start" : "center"} 
              className="w-48"
            >
              <DropdownMenuLabel className="text-xs font-semibold">
                Ações da Conta
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut} 
                className="text-destructive cursor-pointer focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="text-sm">Confirmar Saída</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};