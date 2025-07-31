import React, { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleRoleChange = () => {
      // Forçar recarregamento da sidebar quando o role muda
      console.log("Role changed - reloading sidebar");
    };

    window.addEventListener('userRoleChanged', handleRoleChange);
    return () => window.removeEventListener('userRoleChanged', handleRoleChange);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isMobile ? (
        <>
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="fixed top-4 left-4 z-40 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              {/* Adicione key para forçar recriação */}
              <AppSidebar key={currentUser?.role} />
            </SheetContent>
          </Sheet>
          
          <div className="fixed top-4 right-4 z-40">
            <NotificationBell />
          </div>
          
          <main className="flex-1 overflow-auto p-6 pt-16">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </>
      ) : (
        <>
          {/* Adicione key para forçar recriação */}
          <AppSidebar key={currentUser?.role} />
          
          <div className="fixed top-4 right-4 z-40">
            <NotificationBell />
          </div>
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default AppLayout;