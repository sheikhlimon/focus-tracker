import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "../../hooks/useCalendar";
import DateCard from "./DateCard";

interface CalendarViewProps {
  month: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ month }: CalendarViewProps) {
  const { days, label, nextMonth, prevMonth } = useCalendar(month);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80 transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="min-w-[10rem] text-center text-lg font-semibold tracking-tight">
          {label}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80 transition-colors cursor-pointer"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => (
          <div
            key={day.date}
            className="animate-in"
            style={{ animationDelay: `${i * 20}ms` }}
          >
            <DateCard date={day.date} isToday={day.date === today} />
          </div>
        ))}
      </div>
    </div>
  );
}
