import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DayPickerSingleProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = Omit<DayPickerSingleProps, "mode" | "selected" | "onSelect" | "components"> & {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  mode = "single",
  onSelect,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      mode="single"
      selected={selected}
      onSelect={onSelect}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />
      }}
      classNames={{
        months: "flex flex-col w-full space-y-2",
        month: "space-y-2 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-center flex-1",
        nav: "space-x-1 flex items-center absolute w-full justify-between",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full justify-between",
        head_cell:
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-2 justify-between",
        cell: cn(
          "flex-1 relative text-center",
          "before:absolute before:inset-0 before:rounded-md before:transition-colors",
          "[&:has([aria-selected])]:before:bg-accent/50",
          "first:[&:has([aria-selected])]:before:rounded-l-md",
          "last:[&:has([aria-selected])]:before:rounded-r-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-full p-0 font-normal aria-selected:opacity-100 relative z-10"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary/80 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground",
        day_today: "bg-accent/30 text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent/30 aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }