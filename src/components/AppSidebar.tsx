import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Laptop, Calendar, Users,
  PlusCircle, LogOut, ChevronDown,
  ChevronUp, FileText, Bell,
  CalendarCheck, ShoppingCart, Wrench,
  Warehouse, Bug
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
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
        "hover:bg-gradient-to-r hover:from-sidebar/10 hover:to-eccos-purple/10 hover:shadow-md hover:scale-[1.02] hover:border-gray-100",
        "border border-transparent hover:border-gray-100/50",
        active 
          ? "bg-gradient-to-r from-sidebar/15 to-eccos-purple/15 text-eccos-purple shadow-lg border-eccos-purple/20 scale-[1.02]" 
          : "text-gray-700",
        expanded ? "w-full" : "w-12 justify-center"
      )}
      tabIndex={0}
    >
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      <Icon className={cn(
        "h-5 w-5 shrink-0 stroke-[1.5] transition-all duration-300 relative z-10",
        active ? "stroke-eccos-purple drop-shadow-sm" : "stroke-gray-600 group-hover:stroke-eccos-purple"
      )} />
      <span className={cn(
        "transition-all duration-300 font-medium relative z-10",
        active ? "text-eccos-purple font-semibold" : "group-hover:text-eccos-purple",
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
        "flex items-center gap-3 px-6 py-2.5 rounded-lg transition-all duration-300 group relative ml-2",
        "hover:bg-gradient-to-r hover:from-sidebar/8 hover:to-eccos-purple/8 hover:shadow-sm hover:scale-[1.01]",
        "border border-transparent hover:border-gray-100/30",
        active 
          ? "bg-gradient-to-r from-sidebar/12 to-eccos-purple/12 text-eccos-purple shadow-md border-eccos-purple/15" 
          : "text-gray-600",
        expanded ? "w-full" : "w-10 justify-center"
      )}
    >
      <Icon className={cn(
        "h-4 w-4 shrink-0 stroke-[1.5] transition-all duration-300",
        active ? "stroke-eccos-purple" : "stroke-gray-500 group-hover:stroke-eccos-purple"
      )} />
      <span className={cn(
        "transition-all duration-300 font-medium text-sm",
        active ? "text-eccos-purple font-semibold" : "group-hover:text-eccos-purple",
        expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
      )}>
        {children}
      </span>
      
      {/* Mini indicador para submenus ativos */}
      {active && (
        <div className="absolute left-1 w-1 h-4 rounded-full bg-gradient-to-b from-sidebar to-eccos-purple" />
      )}
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
  
  // Verifica se algum submenu está ativo
  const hasActiveChild = React.Children.toArray(children).some((child: any) => 
    location.pathname === child.props.href
  );
  
  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 rounded-xl group relative overflow-hidden",
          "transition-all duration-300 hover:scale-[1.02]",
          "hover:bg-gradient-to-r hover:from-sidebar/10 hover:to-eccos-purple/10 hover:shadow-md",
          "border border-transparent hover:border-gray-100/50",
          hasActiveChild 
            ? "bg-gradient-to-r from-sidebar/15 to-eccos-purple/15 text-eccos-purple shadow-lg border-eccos-purple/20" 
            : "text-gray-700 hover:text-eccos-purple",
          expanded ? "pr-3" : "justify-center"
        )}
      >
        {/* Efeito de brilho no hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        
        <div className="flex items-center gap-3 relative z-10">
          <Icon className={cn(
            "h-5 w-5 shrink-0 stroke-[1.5] transition-all duration-300",
            hasActiveChild ? "stroke-eccos-purple drop-shadow-sm" : "stroke-gray-600 group-hover:stroke-eccos-purple"
          )} />
          <span className={cn(
            "transition-all duration-300 font-medium",
            hasActiveChild ? "text-eccos-purple font-semibold" : "group-hover:text-eccos-purple",
            expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            {label}
          </span>
        </div>
        {expanded && (
          <div className="relative z-10">
            {isOpen ? (
              <ChevronUp className={cn(
                "h-4 w-4 stroke-[1.5] transition-all duration-300",
                hasActiveChild ? "stroke-eccos-purple" : "stroke-gray-600 group-hover:stroke-eccos-purple"
              )} />
            ) : (
              <ChevronDown className={cn(
                "h-4 w-4 stroke-[1.5] transition-all duration-300",
                hasActiveChild ? "stroke-eccos-purple" : "stroke-gray-600 group-hover:stroke-eccos-purple"
              )} />
            )}
          </div>
        )}
      </button>
      <div className={cn(
        "space-y-1 transition-all duration-300 overflow-hidden",
        isOpen && expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
    { icon: Bug, label: "Suporte Plataforma", href: "/suporte-plataforma" },
  ];

   return (
    <div
      className={cn(
        "h-screen bg-slate-50 border-r border-gray-100 flex flex-col relative overflow-hidden",
        "transition-all duration-300 z-10 backdrop-blur-lg shadow-2xl",
        expanded ? "w-72" : "w-20",
      )}
    >
      {/* Fundos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-sidebar/20 to-eccos-purple/20 blur-2xl opacity-50"></div>
        <div className="absolute top-1/3 -left-10 h-24 w-24 rounded-full bg-gradient-to-tr from-eccos-purple/15 to-sidebar/15 blur-xl opacity-40"></div>
        <div className="absolute bottom-1/4 -right-8 h-20 w-20 rounded-full bg-gradient-to-bl from-sidebar/25 to-eccos-purple/25 blur-xl opacity-30"></div>
      </div>

      {/* Cabeçalho Fixo */}
      <div className="h-24 shrink-0 flex items-center justify-between p-1 relative z-10">
        <Link 
          to="/"
          className={cn(
            "flex items-center justify-center overflow-hidden px-4 py-0 w-full group",
            expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          <div className="relative">
            <img
              src={Logo}
              alt="Logo ECCOS"
              className={cn(
                "h-32 w-32 object-contain transition-all duration-500 shrink-0",
                "cursor-pointer group-hover:scale-110 group-hover:drop-shadow-lg filter" 
              )}
            />
            {/* Efeito de brilho no logo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
          </div>
        </Link>

        {/* Botão de expansão/contração - apenas para telas menores */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "md:hidden absolute -right-3 top-1/2 -translate-y-1/2 z-20",
            "w-6 h-6 rounded-full bg-white shadow-lg border border-gray-200",
            "flex items-center justify-center text-gray-600 hover:text-eccos-purple",
            "transition-all duration-300 hover:shadow-xl hover:scale-110"
          )}
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3 rotate-90" />
          ) : (
            <ChevronDown className="h-3 w-3 -rotate-90" />
          )}
        </button>
      </div>

      {/* Conteúdo Rolável */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative z-10 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
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
            {/* Divider com gradiente */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <div className="px-3 bg-slate-50">
                  <span className={cn(
                    "text-xs font-semibold tracking-wider transition-all duration-300",
                    "text-transparent bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text uppercase",
                    expanded ? "opacity-100" : "opacity-0"
                  )}>
                    {isAdmin ? "Administração" :
                     userRole === 'financeiro' ? "Recursos Financeiros" :
                     userRole === 'operacional' ? "Manutenção" : "Suporte Operacional"}
                  </span>
                </div>
              </div>
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
      </div>

      {/* Footer Fixo */}
      <div className="shrink-0 pt-4 pb-4 px-4 border-t border-gray-100 relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full p-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                "hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-lg hover:scale-[1.02]",
                "focus:outline-none flex items-center gap-3 text-gray-700 hover:text-red-600",
                "border border-transparent hover:border-red-200/50",
                expanded ? "px-4 justify-start" : "justify-center"
              )}
              aria-label="Menu de logout"
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              <LogOut className="h-5 w-5 shrink-0 stroke-[1.5] transition-all duration-300 relative z-10 group-hover:stroke-red-600" />
              {expanded && (
                <span className="text-sm transition-all duration-300 font-medium relative z-10 group-hover:text-red-600">
                  Sair
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={expanded ? "start" : "center"}
            className="rounded-xl shadow-xl border-gray-100 bg-white/95 backdrop-blur-sm"
          >
            <DropdownMenuLabel className="text-xs font-semibold text-gray-600 bg-gradient-to-r from-sidebar/10 to-eccos-purple/10 rounded-t-lg">
              Ações da Conta
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-100" />
            <DropdownMenuItem
              onClick={signOut}
              className="text-red-600 cursor-pointer focus:bg-red-50 hover:bg-red-50 rounded-lg m-1 transition-all duration-200 font-medium"
            >
              <LogOut className="mr-2 h-4 w-4 stroke-[1.5]" />
              <span className="text-sm">Confirmar Saída</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Overlay para dispositivos móveis */}
      {expanded && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]"
          onClick={() => setExpanded(false)}
        />
      )}
    </div>
  );
};