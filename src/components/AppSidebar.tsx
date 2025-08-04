import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Laptop,
  Users,
  PlusCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  FileText,
  Bell,
  CalendarCheck,
  CalendarCheck2,
  ShoppingCart,
  Wrench,
  Warehouse,
  Bug,
  Calendar as CalendarIcon,
  Shield,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/images/logo-eccos.png";

const SidebarItem = ({ icon: Icon, label, href, active, expanded }: any) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
        "hover:bg-gradient-to-r hover:from-sidebar/10 hover:to-eccos-purple/10 hover:shadow-md hover:scale-[1.02]",
        "border border-transparent hover:border-gray-100/50",
        active
          ? "bg-gradient-to-r from-sidebar/15 to-eccos-purple/15 text-eccos-purple shadow-lg border-eccos-purple/20 scale-[1.02]"
          : "text-gray-700",
        expanded ? "w-full" : "w-12 justify-center"
      )}
      tabIndex={0}
      aria-current={active ? "page" : undefined}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 stroke-[1.5] transition-all duration-300 relative z-10",
          active ? "stroke-eccos-purple drop-shadow-sm" : "stroke-gray-600 group-hover:stroke-eccos-purple"
        )}
      />
      <span
        className={cn(
          "transition-all duration-300 font-medium relative z-10",
          active ? "text-eccos-purple font-semibold" : "group-hover:text-eccos-purple",
          expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}
      >
        {label}
      </span>
    </Link>
  );
};

const SubMenuItem = ({ href, active, expanded, children, icon: Icon }: any) => {
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
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 stroke-[1.5] transition-all duration-300",
          active ? "stroke-eccos-purple" : "stroke-gray-500 group-hover:stroke-eccos-purple"
        )}
      />
      <span
        className={cn(
          "transition-all duration-300 font-medium text-sm",
          active ? "text-eccos-purple font-semibold" : "group-hover:text-eccos-purple",
          expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}
      >
        {children}
      </span>
      {active && (
        <div className="absolute left-1 w-1 h-4 rounded-full bg-gradient-to-b from-sidebar to-eccos-purple" />
      )}
    </Link>
  );
};

const SidebarSubMenu = ({ label, icon: Icon, children, expanded }: any) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveChild = React.Children.toArray(children).some(
    (child: any) => location.pathname === child.props.href
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
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <div className="flex items-center gap-3 relative z-10">
          <Icon
            className={cn(
              "h-5 w-5 shrink-0 stroke-[1.5] transition-all duration-300",
              hasActiveChild
                ? "stroke-eccos-purple drop-shadow-sm"
                : "stroke-gray-600 group-hover:stroke-eccos-purple"
            )}
          />
          <span
            className={cn(
              "transition-all duration-300 font-medium",
              hasActiveChild ? "text-eccos-purple font-semibold" : "group-hover:text-eccos-purple",
              expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}
          >
            {label}
          </span>
        </div>
        {expanded && (
          <div className="relative z-10">
            {isOpen ? (
              <ChevronUp
                className={cn(
                  "h-4 w-4 stroke-[1.5] transition-all duration-300",
                  hasActiveChild ? "stroke-eccos-purple" : "stroke-gray-600 group-hover:stroke-eccos-purple"
                )}
              />
            ) : (
              <ChevronDown
                className={cn(
                  "h-4 w-4 stroke-[1.5] transition-all duration-300",
                  hasActiveChild ? "stroke-eccos-purple" : "stroke-gray-600 group-hover:stroke-eccos-purple"
                )}
              />
            )}
          </div>
        )}
      </button>
      <div
        className={cn(
          "space-y-1 transition-all duration-300 overflow-hidden",
          isOpen && expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {React.Children.map(children, (child) =>
          React.cloneElement(child as React.ReactElement, {
            active: location.pathname === (child as React.ReactElement).props.href,
            expanded,
          })
        )}
      </div>
    </div>
  );
};

export const AppSidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const { signOut, currentUser, userPermissions, isSuperAdmin } = useAuth();
  
  // Reset sidebar state when user changes
  useEffect(() => {
    setExpanded(true);
  }, [currentUser?.role]);

  const userMenuItems = [
    { icon: Home, label: "Página Inicial", href: "/" },
    { icon: FileText, label: "Minhas Solicitações", href: "/minhas-solicitacoes" },
    {
      icon: PlusCircle,
      label: "Nova Solicitação",
      items: [
        { icon: CalendarCheck, label: "Reserva", href: "/nova-solicitacao/reserva" },
        { icon: ShoppingCart, label: "Compra", href: "/nova-solicitacao/compra" },
        { icon: Wrench, label: "Manutenção", href: "/nova-solicitacao/suporte" },
      ],
    },
  ];

  const adminMenuItems = useMemo(() => [
    {
      category: "Compras",
      icon: ShoppingCart,
      items: [
        { 
          icon: ShoppingCart, 
          label: "Financeiro", 
          href: "/compras-financeiro", 
          permission: "compras-financeiro" 
        },
        { 
          icon: ShoppingCart, 
          label: "Tecnologia", 
          href: "/compras-tecnologia", 
          permission: "compras-tecnologia" 
        },
        { 
          icon: ShoppingCart, 
          label: "Infraestrutura", 
          href: "/compras-infraestrutura", 
          permission: "compras-infraestrutura" 
        },
        { 
          icon: ShoppingCart, 
          label: "Pedagógico/Admin", 
          href: "/compras-pedagogicoadmin", 
          permission: "compras-pedagogicoadmin" 
        }
      ]
    },
    {
      category: "Recursos",
      icon: Warehouse,
      items: [
        { 
          icon: Warehouse, 
          label: "Estoque", 
          href: "/estoque", 
          permission: "estoque" 
        }
      ]
    },
    {
      category: "Manutenção",
      icon: Wrench,
      items: [
        { 
          icon: Wrench, 
          label: "Operacional", 
          href: "/suporte-operacional", 
          permission: "suporte-operacional" 
        },
        { 
          icon: Bug, 
          label: "Plataforma", 
          href: "/suporte-plataforma", 
          permission: "suporte-plataforma" 
        }
      ]
    },
    {
      category: "Agendamentos",
      icon: CalendarIcon,
      items: [
        { 
          icon: CalendarCheck, 
          label: "Reservas", 
          href: "/solicitacoes", 
          permission: "solicitacoes" 
        },
        { 
          icon: CalendarIcon, 
          label: "Calendário", 
          href: "/calendario", 
          permission: "calendario-reservas" 
        },
        { 
          icon: CalendarCheck2, 
          label: "Disponibilidade", 
          href: "/disponibilidade", 
          permission: "disponibilidade" 
        },
        { 
          icon: Laptop, 
          label: "Equipamentos", 
          href: "/equipamentos", 
          permission: "equipamentos" 
        }
      ]
    },
    {
      category: "Usuários",
      icon: Users,
      items: [
        { 
          icon: Users, 
          label: "Gerenciamento", 
          href: "/usuarios", 
          permission: "usuarios" 
        },
        { 
          icon: Bell, 
          label: "Notificações", 
          href: "/notificacoes", 
          permission: "notificacoes" 
        }
      ]
    }
  ], []);

  const filteredAdminItems = useMemo(() => {
    return adminMenuItems.map(category => ({
      ...category,
      items: category.items.filter(item => 
        isSuperAdmin || 
        (item.permission && userPermissions[item.permission])
      )
    })).filter(category => category.items.length > 0);
  }, [adminMenuItems, isSuperAdmin, userPermissions]);

  return (
    <div
      className={cn(
        "h-screen bg-slate-50 border-r border-gray-100 flex flex-col relative overflow-hidden",
        "transition-all duration-300 z-10 backdrop-blur-lg shadow-2xl",
        expanded ? "w-72" : "w-20"
      )}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-sidebar/20 to-eccos-purple/20 blur-2xl opacity-50"></div>
        <div className="absolute top-1/3 -left-10 h-24 w-24 rounded-full bg-gradient-to-tr from-eccos-purple/15 to-sidebar/15 blur-xl opacity-40"></div>
        <div className="absolute bottom-1/4 -right-8 h-20 w-20 rounded-full bg-gradient-to-bl from-sidebar/25 to-eccos-purple/25 blur-xl opacity-30"></div>
      </div>

      <div className="h-24 shrink-0 flex items-center justify-between p-1 relative z-10">
        <Link
          to="/"
          className={cn(
            "flex items-center justify-center overflow-hidden px-4 py-0 w-full group",
            expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}
        >
          <img
            src={Logo}
            alt="Logo ECCOS"
            className="h-32 w-32 object-contain transition-all duration-500 shrink-0 cursor-pointer group-hover:scale-110 group-hover:drop-shadow-lg"
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative z-10 custom-scrollbar">
        {userMenuItems.map((item, index) => {
          if ("items" in item) {
            return (
              <SidebarSubMenu key={index} label={item.label} icon={item.icon} expanded={expanded}>
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

        {filteredAdminItems.length > 0 && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>
              <div className="relative flex justify-center">
                <div className="px-3 bg-slate-50">
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-wider uppercase",
                      "text-transparent bg-gradient-to-r from-sidebar to-eccos-purple bg-clip-text",
                      expanded ? "opacity-100" : "opacity-0"
                    )}
                  >
                  </span>
                </div>
              </div>
            </div>

            {filteredAdminItems.map((category, index) => (
              <SidebarSubMenu 
                key={`category-${index}`} 
                label={category.category} 
                icon={category.icon} 
                expanded={expanded}
              >
                {category.items.map((item, itemIndex) => (
                  <SubMenuItem
                    key={`admin-${itemIndex}`}
                    href={item.href}
                    active={location.pathname === item.href}
                    expanded={expanded}
                    icon={item.icon}
                  >
                    {item.label}
                  </SubMenuItem>
                ))}
              </SidebarSubMenu>
            ))}
          </>
        )}
      </div>

      <div className="shrink-0 pt-4 pb-4 px-4 border-t border-gray-100 relative z-10">
        <Link 
          to="/perfil"
          className={cn(
            "flex items-center gap-3 p-3 mb-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            "hover:bg-gradient-to-r hover:from-sidebar/10 hover:to-eccos-purple/10 hover:shadow-md hover:scale-[1.02]",
            "border border-transparent hover:border-gray-100/50",
            location.pathname === "/perfil" 
              ? "bg-gradient-to-r from-sidebar/15 to-eccos-purple/15 text-eccos-purple shadow-lg border-eccos-purple/20 scale-[1.02]" 
              : "",
            expanded ? "w-full" : "w-12 justify-center"
          )}
        >
          {currentUser?.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt="User profile" 
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-sidebar to-eccos-purple text-white font-bold">
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {expanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-700 group-hover:text-eccos-purple transition-colors duration-300 truncate">
                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-gray-500 group-hover:text-eccos-purple/80 transition-colors duration-300 capitalize">
                {currentUser?.role}
              </span>
            </div>
          )}
        </Link>
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
    </div>
  );
};