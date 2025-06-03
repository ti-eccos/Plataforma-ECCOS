import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { isSameDay } from "date-fns";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiersStyles,
  ...props
}: CalendarProps) {
  return (
  <DayPicker
    showOutsideDays={showOutsideDays}
    className={cn(
      "p-1 sm:p-2 w-full h-full rounded-xl border border-gray-200 bg-white shadow-sm",
      className
    )}
    modifiersStyles={{
      available: {
        border: "2px solid #22c55e",
        borderRadius: "999px",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
      },
      selectedAdd: {
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderRadius: "999px",
      },
      selectedRemove: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: "999px",
      },
      today: {
        fontWeight: "600",
        color: "#6b7280",
        outline: "2px solid #e5e7eb",
      },
      ...modifiersStyles,
    }}
    classNames={{
      caption: "flex justify-center pt-1 relative items-center",
      caption_label:
        "text-sm sm:text-base font-semibold text-gray-800 text-center flex-grow truncate px-2",
      nav: "absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex justify-between items-center px-2",
      nav_button: cn(
        buttonVariants({ variant: "outline" }),
        "h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-70 hover:opacity-100 rounded-md z-10 pointer-events-auto"
      ),
      table: "w-full border-collapse space-y-1 mt-2",
      head_row: "grid grid-cols-7 gap-px w-full",
      head_cell: "text-gray-500 text-xs font-medium uppercase tracking-wider py-1 sm:py-2",
      row: "grid grid-cols-7 gap-px w-full mt-1",
      cell: "h-10 w-10 p-0 text-center relative flex items-center justify-center sm:h-9 sm:w-9",
      day: cn(
        buttonVariants({ variant: "ghost" }),
        "h-10 w-10 p-0 font-normal hover:bg-gray-100 rounded-full transition-colors text-sm sm:h-9 sm:w-9 sm:text-xs"
      ),
      day_selected:
        "bg-eccos-purple text-white hover:bg-eccos-purple/90 rounded-full",
      day_today: "bg-gray-100 text-gray-900 font-semibold rounded-full",
      day_outside: "text-gray-400 opacity-50",
      day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
      day_range_middle:
        "aria-selected:bg-gray-100 aria-selected:text-gray-900 rounded-none",
      ...classNames,
    }}
    components={{
      IconLeft: () => <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />,
      IconRight: () => <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />,
      DayContent: ({ date }) => {
        const isToday = isSameDay(date, new Date());
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            <span
              className={cn(
                isToday ? "font-bold text-gray-900" : "text-gray-700",
                "text-xs sm:text-sm"
              )}
            >
              {date.getDate()}
            </span>
          </div>
        );
      },
    }}
    {...props}
  />
);
}

Calendar.displayName = "Calendar";

export { Calendar };