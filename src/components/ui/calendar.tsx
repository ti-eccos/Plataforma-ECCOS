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
      className={cn("p-2 pointer-events-auto w-full h-full rounded-2xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-2 sm:space-x-2 sm:space-y-0 w-full h-full",
        month: "space-y-2 w-full px-2 pb-2",
        caption: "flex justify-center pt-2 relative items-center",
        caption_label: "text-sm font-medium text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent border-gray-200 p-0 opacity-70 hover:opacity-100 rounded-lg"
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse space-y-1",
        head_row: "grid grid-cols-7 gap-px w-full",
        head_cell: "text-gray-400 text-[0.7rem] font-medium px-0 py-1",
        row: "grid grid-cols-7 w-full gap-px",
        cell: "h-9 text-center text-sm p-0 relative",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-lg transition-colors"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-eccos-purple text-white hover:bg-eccos-purple/90",
        day_today: "bg-gray-100 text-foreground font-semibold",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 text-foreground" />,
        IconRight: () => <ChevronRight className="h-4 w-4 text-foreground" />,
      }}
      modifiersClassNames={{
        available: "border-2 border-green-500",
        ...props.modifiersClassNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };