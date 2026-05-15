import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCalendar } from "../../hooks/useCalendar";
import { getLocalDate } from "../../lib/utils";

interface CalendarViewProps {
  month: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ month }: CalendarViewProps) {
  const navigate = useNavigate();
  const { days, label, nextMonth, prevMonth } = useCalendar(month);

  const today = getLocalDate();

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
        {days.map((day, i) => {
          const isToday = day.date === today;
          return (
            <button
              key={day.date}
              onClick={() => navigate(`/day/${day.date}`)}
              className={`relative flex items-center justify-center rounded-lg p-2 text-sm transition-all duration-200 cursor-pointer
                ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                ${!day.isCurrentMonth ? "text-muted-foreground/30 hover:bg-muted/50" : !isToday ? "text-foreground hover:bg-muted" : ""}`}
              style={{ animationDelay: `${i * 20}ms` }}
            >
              {parseInt(day.date.split("-")[2], 10)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
