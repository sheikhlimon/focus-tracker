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
  onStart: () => void;
  onPause: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export default function TaskItem({
  task,
  onStart,
  onPause,
  onComplete,
  onDelete,
}: TaskItemProps) {
  const isActive = task.status === "active";
  const isCompleted = task.status === "completed";

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200",
        isActive && "bg-primary/8 shadow-sm ring-1 ring-primary/20",
        isCompleted && "opacity-50",
        !isActive && !isCompleted && "hover:bg-muted/50",
      )}
    >
      <div
        aria-label="Drag to reorder"
        className="cursor-grab text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>

      <span
        className={cn(
          "flex-1 text-sm font-medium",
          isCompleted && "line-through text-muted-foreground",
        )}
      >
        {task.title}
      </span>

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
