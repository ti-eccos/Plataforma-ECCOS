import * as React from "react";
import { cn } from "@/lib/utils";

export interface MultiSelectProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ values, onValuesChange, placeholder = "Selecione...", options, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleValue = (value: string) => {
      const newValues = values.includes(value)
        ? values.filter(v => v !== value)
        : [...values, value];
      onValuesChange(newValues);
    };

    const removeValue = (value: string) => {
      onValuesChange(values.filter(v => v !== value));
    };

    return (
      <div 
        ref={ref}
        className={cn("relative w-full", className)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsOpen(false);
          }
        }}
      >
        <div
          className="flex flex-wrap gap-2 p-2 border rounded-md cursor-text bg-background hover:border-primary"
          onClick={() => setIsOpen(true)}
        >
          {values.length === 0 && (
            <span className="text-muted-foreground ml-1">{placeholder}</span>
          )}
          
          {values.map(value => {
            const option = options.find(opt => opt.value === value);
            return (
              <div
                key={value}
                className="flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-accent"
              >
                {option?.icon}
                <span>{option?.label || value}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(value);
                  }}
                  className="ml-1 rounded-full hover:bg-accent/50"
                >
                  ×
                </button>
              </div>
            );
          })}
          
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[50px] bg-transparent outline-none"
            placeholder={values.length > 0 ? "Buscar..." : ""}
          />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 border rounded-md shadow-lg bg-background">
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 p-2 cursor-pointer hover:bg-accent",
                    values.includes(option.value) && "bg-accent/50"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleValue(option.value)}
                >
                  {option.icon}
                  <span>{option.label}</span>
                  {values.includes(option.value) && (
                    <span className="ml-auto">✓</span>
                  )}
                </div>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">
                  Nenhum resultado encontrado
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";