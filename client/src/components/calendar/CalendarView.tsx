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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label}</h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
          >
            &larr;
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
          >
            &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <DateCard
            key={day.date}
            date={day.date}
            isToday={day.date === today}
          />
        ))}
      </div>
    </div>
  );
}
