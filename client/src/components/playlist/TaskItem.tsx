import { GripVertical, Play, Pause, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Task {
  id: number;
  title: string;
  status: "queued" | "active" | "completed";
  position: number;
}

export interface TaskItemProps {
  task: Task;
  elapsed?: number;
  isTimerRunning?: boolean;
  focusInterval?: number;
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
  focusInterval = 25,
  onStart,
  onPause,
  onComplete,
  onDelete,
}: TaskItemProps) {
  const isActive = task.status === "active";
  const isCompleted = task.status === "completed";
  const intervalSeconds = focusInterval * 60;
  const progress = isActive
    ? Math.min((elapsed / intervalSeconds) * 100, 100)
    : 0;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 overflow-hidden",
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
        className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>

      <span
        className={cn(
          "relative flex-1 text-sm font-medium",
          isCompleted && "line-through text-muted-foreground",
        )}
      >
        {task.title}
      </span>

      {isActive && elapsed > 0 && (
        <span className="relative tabular-nums text-xs text-muted-foreground">
          {formatTime(elapsed)}
        </span>
      )}

      <div className="flex items-center gap-1">
        {task.status === "queued" && (
          <button
            onClick={onStart}
            aria-label="Start task"
            className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Play className="size-4" />
          </button>
        )}

        {isActive && (
          <>
            <button
              onClick={onPause}
              aria-label="Pause task"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Pause className="size-4" />
            </button>
            <button
              onClick={onComplete}
              aria-label="Complete task"
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Delete task"
              className="rounded-lg p-1.5 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </>
        )}

        {isCompleted && (
          <button
            onClick={onDelete}
            aria-label="Delete task"
            className="rounded-lg p-1.5 text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
