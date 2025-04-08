
import React from "react";
import { AppSidebar } from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background p-6">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
