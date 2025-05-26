import { cn } from "@/lib/utils";
import React from "react";

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio: number;
}

export const AspectRatio = ({
  ratio,
  className,
  children,
  ...props
}: AspectRatioProps) => {
  return ratio === 0 ? (
    <div className={className} {...props}>
      {children}
    </div>
  ) : (
    <div
      className={cn("relative w-full", className)}
      style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
      {...props}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
};