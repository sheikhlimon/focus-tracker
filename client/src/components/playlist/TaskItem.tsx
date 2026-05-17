import { GripVertical, Play, Pause, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  title: string;
  status: "queued" | "active" | "completed";
  position: number;
  url: string | null;
  durationMin: number;
  session: "day" | "night";
}

export interface TaskItemProps {
  task: Task;
  elapsed?: number;
  isTimerRunning?: boolean;
  focusInterval?: number;
  dragHandleProps?: Record<string, unknown>;
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TaskItem({
  task,
  elapsed = 0,
  dragHandleProps,
  onStart,
  onPause,
  onDelete,
}: TaskItemProps) {
  const isActive = task.status === "active";
  const isCompleted = task.status === "completed";
  const intervalSeconds = task.durationMin * 60;
  const progress = isActive
    ? Math.min((elapsed / intervalSeconds) * 100, 100)
    : 0;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 overflow-hidden",
        isActive && "bg-primary/8 shadow-sm ring-1 ring-primary/20",
        isCompleted && "opacity-50",
        !isActive && !isCompleted && "hover:bg-muted/50",
      )}
    >
      {isActive && progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      )}
      <div
        aria-label="Drag to reorder"
        className="relative flex-shrink-0 cursor-grab p-0.5 text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="size-4" />
      </div>

      <span
        className={cn(
          "relative min-w-0 flex-1 truncate text-sm font-medium",
          isCompleted && "line-through text-muted-foreground",
        )}
      >
        {task.title}
      </span>

      {task.url && (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="relative flex-shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}

      {isActive && (
        <span className="relative flex-shrink-0 tabular-nums text-xs text-muted-foreground">
          {formatTime(elapsed)}
        </span>
      )}

      <div className="relative flex flex-shrink-0 items-center gap-0.5">
        {task.status === "queued" && (
          <>
            <button
              onClick={onStart}
              aria-label="Start task"
              className="rounded-lg p-1.5 text-primary hover:bg-primary/10 active:bg-primary/20 transition-colors cursor-pointer"
            >
              <Play className="size-4" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete task"
              className="rounded-lg p-1.5 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </>
        )}

        {isActive && (
          <>
            <button
              onClick={onPause}
              aria-label="Pause task"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors cursor-pointer"
            >
              <Pause className="size-4" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete task"
              className="rounded-lg p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </>
        )}

        {isCompleted && (
          <button
            onClick={onDelete}
            aria-label="Delete task"
            className="rounded-lg p-1.5 text-destructive/40 hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
