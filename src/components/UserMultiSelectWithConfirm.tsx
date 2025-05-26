// components/UserMultiSelectWithConfirm.tsx
import * as React from "react";
import { Check, ChevronsUpDown, CheckCheck, XCircle } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserOption {
  value: string;
  label: string;
}

interface UserMultiSelectWithConfirmProps {
  options: UserOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  clearLabel?: string; 
}

export function UserMultiSelectWithConfirm({
  options,
  selected,
  onChange,
  placeholder = "Selecione os usuários...",
  clearLabel = "Limpar Tudo" // Valor padrão adicionado
}: UserMultiSelectWithConfirmProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState<string[]>(selected);

  React.useEffect(() => {
    setSelectedValues(selected);
  }, [selected]);

  const handleConfirm = () => {
    onChange(selectedValues);
    setOpen(false);
  };

  const toggleSelection = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const handleClearAll = () => {
  setSelectedValues([]);
  onChange([]);
  setOpen(false);
};

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 rounded-xl border-gray-200 hover:border-eccos-purple focus:border-eccos-purple text-left font-normal"
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((email) => {
                const user = options.find((o) => o.value === email);
                return (
                  <Badge key={email} variant="secondary" className="px-2 py-0.5">
                    {user?.label || email}
                  </Badge>
                );
              })
            ) : (
              <span className="text-sm text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[300px] max-h-[400px] overflow-auto shadow-lg">
        <Command>
          <CommandInput placeholder="Buscar usuário..." />
          <CommandList>
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => toggleSelection(option.value)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-gray-300",
                      selectedValues.includes(option.value)
                        ? "bg-sidebar border-sidebar text-white"
                        : "border-gray-300"
                    )}
                  >
                    {selectedValues.includes(option.value) && <Check className="h-3 w-3" />}
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup className="mt-2 border-t pt-2">
  <div className="flex justify-between px-2 pb-2">
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClearAll}
      className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
    >
      <XCircle className="h-3 w-3 mr-1" />
      {clearLabel || "Limpar Tudo"}
    </Button>
    <Button
      size="sm"
      variant="secondary"
      onClick={handleConfirm}
      className="text-xs px-2 py-1"
    >
      <CheckCheck className="h-3 w-3 mr-1" />
      Confirmar
    </Button>
  </div>
</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}