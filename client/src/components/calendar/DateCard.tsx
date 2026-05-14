import { useNavigate } from "react-router-dom";

interface DateCardProps {
  date: string;
  taskCount?: number;
  totalMinutes?: number;
  isToday?: boolean;
  showDayName?: boolean;
}

export default function DateCard({
  date,
  taskCount = 0,
  totalMinutes = 0,
  isToday = false,
  showDayName = false,
}: DateCardProps) {
  const navigate = useNavigate();

  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel = totalMinutes > 0 ? `${hours}h ${mins}m` : null;

  return (
    <button
      onClick={() => navigate(`/day/${date}`)}
      className={`w-full rounded-xl p-3 text-left transition-all duration-200 cursor-pointer active:scale-[0.98]
        ${isToday ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card hover:bg-accent active:bg-accent/80"}`}
    >
      <div className="relative flex items-center justify-center">
        {showDayName && (
          <span
            className={`absolute left-0 text-lg font-semibold ${isToday ? "text-primary-foreground/70" : "text-muted-foreground"}`}
          >
            {dayName}
          </span>
        )}
        <span className="text-lg font-semibold">{day}</span>
        {taskCount > 0 && (
          <span
            className={`absolute right-0 text-xs ${isToday ? "text-primary-foreground/70" : "text-muted-foreground"}`}
          >
            {taskCount} {taskCount === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>
      {timeLabel && (
        <span
          className={`text-xs ${isToday ? "text-primary-foreground/70" : "text-muted-foreground"}`}
        >
          {timeLabel}
        </span>
      )}
    </button>
  );
}
