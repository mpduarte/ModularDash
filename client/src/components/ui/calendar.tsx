import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type SelectSingleEventHandler, type DayPickerDefaultProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = Partial<DayPickerDefaultProps>

interface IconProps extends React.ComponentProps<"button"> {
  onClick?: () => void;
}

const IconLeft: React.FC<IconProps> = React.forwardRef<HTMLButtonElement, IconProps>(
  function IconLeft(props, ref) {
    return (
      <button ref={ref} onClick={props.onClick}>
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }
);

const IconRight: React.FC<IconProps> = React.forwardRef<HTMLButtonElement, IconProps>(
  function IconRight(props, ref) {
    return (
      <button ref={ref} onClick={props.onClick}>
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }
);

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  mode = "single",
  onSelect,
  ...props
}: CalendarProps) {
  const handleSelect: SelectSingleEventHandler = (day, selectedDay, activeModifiers, e) => {
    if (onSelect && day) {
      // Only pass the date to prevent object rendering issues
      onSelect(day, selectedDay, activeModifiers, e);
    }
  };

  // Prevent object props from being passed to the DOM
  const safeProps = { ...props };
  delete safeProps.modifiers;
  delete safeProps.modifiersClassNames;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      mode={mode}
      selected={selected}
      onSelect={handleSelect}
      classNames={{
        months: "flex flex-col w-full space-y-4",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-center flex-1",
        nav: "space-x-1 flex items-center absolute w-full justify-between",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
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
          "[&:has([aria-selected])]:before:bg-accent",
          "first:[&:has([aria-selected])]:before:rounded-l-md",
          "last:[&:has([aria-selected])]:before:rounded-r-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-full p-0 font-normal aria-selected:opacity-100 relative z-10"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft,
        IconRight,
      }}
      {...safeProps}
      disabled={props.disabled}
      fromDate={props.fromDate}
      toDate={props.toDate}
      defaultMonth={props.defaultMonth}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
