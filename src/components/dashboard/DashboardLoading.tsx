
import React from "react";

interface DashboardLoadingProps {
  isLoading: boolean;
  isError: boolean;
}

export function DashboardLoading({ isLoading, isError }: DashboardLoadingProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-destructive p-4 border border-destructive rounded-md">
        Erro ao carregar dados. Tente novamente mais tarde.
      </div>
    );
  }

  return null;
}
