import React from "react";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  onClick?: () => void;
  colorClass?: string;
}

export const StatCard = ({ title, value, icon, onClick, colorClass = 'border-primary' }: StatCardProps) => {
  return (
    <Button 
      variant="outline" 
      className={`h-32 w-full flex flex-col items-center justify-center gap-2 transition-all hover:bg-muted ${colorClass}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-lg font-semibold">{value}</span>
      </div>
      <span className="text-sm text-muted-foreground">{title}</span>
    </Button>
  );
};