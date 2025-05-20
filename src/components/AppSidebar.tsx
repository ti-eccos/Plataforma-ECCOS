import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Laptop, Calendar, Users,
  PlusCircle, LogOut, ChevronDown,
  ChevronUp, FileText, Bell,
  CalendarCheck, ShoppingCart, Wrench,
  Warehouse,
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
import Logo from '@/images/logo-eccos.jpg';

type UserRole = "admin" | "financeiro" | "operacional" | "";
interface User {
  role: UserRole;
}
declare module "@/contexts/AuthContext" {
  interface AuthContextType {
    currentUser: User | null;
    isAdmin: boolean;
    signOut: () => void;
  }
}

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
        "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
        "hover:bg-primary/10 hover:shadow-sm text-foreground",
        active ? "bg-primary/5 text-primary shadow-inner" : "",
        expanded ? "w-full" : "w-12 justify-center"
      )}
      tabIndex={0}
    >
      <Icon className={cn(
        "h-5 w-5 shrink-0 stroke-[1.5]",
        active ? "stroke-primary" : "stroke-foreground"
      )} />
      <span className={cn(
        "transition-all duration-300 font-medium",
        expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
      )}>
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
  icon: React.ElementType;
}
const SubMenuItem = ({ href, active, expanded, children, icon: Icon }: SubMenuItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
        "hover:bg-primary/10 hover:shadow-sm text-foreground",
        active ? "bg-primary/5 text-primary shadow-inner" : "",
        expanded ? "w-full" : "w-12 justify-center"
      )}
    >
      <Icon className={cn(
        "h-5 w-5 shrink-0 stroke-[1.5]",
        active ? "stroke-primary" : "stroke-foreground"
      )} />
      <span className={cn(
        "transition-all duration-300 font-medium",
        expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
      )}>
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
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-xl",
          "transition-colors text-foreground hover:bg-primary/10",
          expanded ? "pr-3" : "justify-center"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0 stroke-[1.5] stroke-foreground" />
          <span className={cn(
            "transition-all duration-300 font-medium",
            expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            {label}
          </span>
        </div>
        {expanded && (
          isOpen ? (
            <ChevronUp className="h-4 w-4 stroke-[1.5] stroke-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 stroke-[1.5] stroke-foreground" />
          )
        )}
      </button>
      <div className={cn(
        "space-y-1 transition-all duration-300 pl-7",
        isOpen && expanded ? "block" : "hidden"
      )}>
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
  const { isAdmin, signOut, currentUser } = useAuth();

  const userRole = currentUser?.role || "";

  const userMenuItems = [
    { icon: Home, label: "Página Inicial", href: "/" },
    { icon: FileText, label: "Minhas Solicitações", href: "/minhas-solicitacoes" },
    {
      icon: PlusCircle,
      label: "Nova Solicitação",
      items: [
        { icon: CalendarCheck, label: "Reserva", href: "/nova-solicitacao/reserva" },
        { icon: ShoppingCart, label: "Compra", href: "/nova-solicitacao/compra" },
        { icon: Wrench, label: "Suporte", href: "/nova-solicitacao/suporte" },
      ]
    },
  ];

  const adminMenuItems = [
    { icon: Calendar, label: "Calendário", href: "/calendario" },
    { icon: Laptop, label: "Equipamentos", href: "/equipamentos" },
    { icon: Calendar, label: "Disponibilidade", href: "/disponibilidade" },
    { icon: Users, label: "Usuários", href: "/usuarios" },
    { icon: FileText, label: "Solicitações", href: "/solicitacoes" },
    { icon: Bell, label: "Notificações", href: "/notificacoes" },
    { icon: Warehouse, label: "Estoque", href: "/estoque" },
  ];

  return (
    <div
      className={cn(
        "h-screen bg-background/95 border-r border-border/40 flex-col",
        "transition-all duration-300 z-10 backdrop-blur-lg shadow-xl rounded-r-xl",
        expanded ? "w-72" : "w-20",
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

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-none">
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
                    icon={subItem.icon}
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

        {(isAdmin || ['financeiro', 'operacional'].includes(userRole)) && (
          <>
            <div className="h-[1px] bg-gradient-to-r from-transparent via-border/30 to-transparent my-4" />

            <div className={cn(
              "px-4 mb-2 text-xs font-medium tracking-wide transition-all",
              "text-foreground/80 uppercase",
              expanded ? "opacity-100" : "opacity-0"
            )}>
              {isAdmin ? "Administração" :
               userRole === 'financeiro' ? "Recursos Financeiros" :
               userRole === 'operacional' ? "Manutenção" : "Suporte Operacional"}
            </div>

            {isAdmin && adminMenuItems.map((item, index) => (
              <SidebarItem
                key={`admin-${index}`}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={location.pathname === item.href}
                expanded={expanded}
              />
            ))}

            {userRole === 'financeiro' && (
              <>
                <SidebarItem
                  icon={ShoppingCart}
                  label="Compras"
                  href="/compras-financeiro"
                  active={location.pathname === "/compras-financeiro"}
                  expanded={expanded}
                />
                <SidebarItem
                  icon={Warehouse}
                  label="Estoque"
                  href="/estoque"
                  active={location.pathname === "/estoque"}
                  expanded={expanded}
                />
                <SidebarItem
                    icon={Bell}
                    label="Notificações"
                    href="/notificacoes"
                    active={location.pathname === "/notificacoes"}
                    expanded={expanded}
                  />
                </>
              )}

            {userRole === 'operacional' && (
              <>
                <SidebarItem
                  icon={Wrench}
                  label="Chamados de Suporte"
                  href="/suporte-operacional"
                  active={location.pathname === "/suporte-operacional"}
                  expanded={expanded}
                />
                <SidebarItem
                  icon={Warehouse}
                  label="Estoque"
                  href="/estoque"
                  active={location.pathname === "/estoque"}
                  expanded={expanded}
                />
              </>
            )}
          </>
        )}

        <div className="mt-auto pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full p-2 hover:bg-primary/10 rounded-xl transition-colors",
                  "focus:outline-none flex items-center gap-2 text-foreground",
                  expanded ? "px-3 justify-start" : "justify-center"
                )}
                aria-label="Menu de logout"
              >
                <LogOut className="h-5 w-5 shrink-0 stroke-[1.5] stroke-foreground" />
                {expanded && (
                  <span className="text-sm transition-all duration-300 font-medium">
                    Sair
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={expanded ? "start" : "center"}
              className="rounded-xl shadow-lg border-border/40"
            >
              <DropdownMenuLabel className="text-xs font-medium text-foreground/80">
                Ações da Conta
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive cursor-pointer focus:bg-destructive/5 rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
                <span className="text-sm font-medium">Confirmar Saída</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};