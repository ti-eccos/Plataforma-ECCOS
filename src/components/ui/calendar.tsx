import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto w-full", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent border-gray-700 p-0 opacity-70 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "grid grid-cols-7 gap-px w-full",
        head_cell: "text-gray-400 text-[0.8rem] font-medium px-0 py-1.5",
        row: "grid grid-cols-7 w-full mt-1 gap-px",
        cell: "h-9 text-center text-sm p-0 relative flex-1",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-full p-0 font-normal hover:bg-gray-800 relative"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-transparent text-foreground hover:bg-gray-800",
        day_today: "text-gray-500 opacity-50 after:absolute after:top-0 after:right-0 after:left-0 after:bottom-0 after:content-[''] after:bg-blue-500 after:h-2 after:w-2 after:rounded-full after:mx-auto after:bottom-0.5",
        day_outside: "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-800 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-gray-500 opacity-50",
        day_range_middle: "aria-selected:bg-gray-800 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 text-foreground" />,
        IconRight: () => <ChevronRight className="h-4 w-4 text-foreground" />,
      }}
      modifiersClassNames={{
        available: "border-2 border-green-500",
        selectedAdd: "relative",
        selectedRemove: "relative",
        ...props.modifiersClassNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };