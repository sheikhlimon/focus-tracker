import { useNavigate } from "react-router-dom";

interface DateCardProps {
  date: string;
  taskCount?: number;
  totalMinutes?: number;
  isToday?: boolean;
}

export default function DateCard({
  date,
  taskCount = 0,
  totalMinutes = 0,
  isToday = false,
}: DateCardProps) {
  const navigate = useNavigate();

  const day = date.split("-")[2];
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeLabel = totalMinutes > 0 ? `${hours}h ${mins}m` : null;

  return (
    <button
      onClick={() => navigate(`/day/${date}`)}
      className={`w-full rounded-xl p-3 text-left transition-colors cursor-pointer
        ${isToday ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
    >
      <div className="flex items-center justify-center">
        <span className="text-lg font-semibold">{Number(day)}</span>
        {taskCount > 0 && (
          <span
            className={`text-xs ${isToday ? "text-primary-foreground/70" : "text-muted-foreground"}`}
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
