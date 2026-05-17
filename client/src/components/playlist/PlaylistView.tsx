import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  useDay,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useReorderTasks,
  useSettings,
  type DayData,
  type DayTask,
} from "../../api/queries";
import type { TaskItemProps } from "./TaskItem";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import PlaylistHeader from "./PlaylistHeader";
import useTimer from "../../hooks/useTimer";
import useNotification from "../../hooks/useNotification";

function SortableTaskItem({
  task,
  index,
  ...props
}: TaskItemProps & { index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: task.id.startsWith("temp-") });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
    >
      <TaskItem task={task} {...props} dragHandleProps={listeners} />
    </div>
  );
}

function TaskGroup({
  label,
  tasks,
  activeTaskId,
  timerElapsed,
  timerIsRunning,
  onStart,
  onPause,
  onComplete,
  onDelete,
  onReorder,
}: {
  label: string;
  tasks: TaskItemProps["task"][];
  activeTaskId: string | null;
  timerElapsed: number;
  timerIsRunning: boolean;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const taskIdToTask = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks],
  );
  const orderedTasks = useMemo(() => {
    if (!localOrder) return tasks;
    const seen = new Set<string>();
    const result: TaskItemProps["task"][] = [];
    for (const id of localOrder) {
      const task = taskIdToTask.get(id);
      if (task) {
        result.push(task);
        seen.add(id);
      }
    }
    for (const task of tasks) {
      if (!seen.has(task.id)) result.push(task);
    }
    return result;
  }, [localOrder, tasks, taskIdToTask]);

  useEffect(() => {
    setLocalOrder(null);
  }, [tasks.map((t) => t.id).join(",")]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = orderedTasks.map((t) => t.id);
    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(currentIds, oldIndex, newIndex);
    setLocalOrder(reordered);
    onReorder(reordered);
  }

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedTasks.map((task, i) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={i}
              elapsed={activeTaskId === task.id ? timerElapsed : 0}
              isTimerRunning={activeTaskId === task.id && timerIsRunning}
              onStart={() => onStart(task.id)}
              onPause={() => onPause(task.id)}
              onComplete={() => onComplete(task.id)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default function PlaylistView() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useDay(date!);
  const { data: settings } = useSettings();
  const addTask = useAddTask(date!);
  const updateTask = useUpdateTask(date!);
  const deleteTask = useDeleteTask(date!);
  const reorderTasks = useReorderTasks(date!);

  const timer = useTimer();
  const { notify, requestPermission, needsPermission } = useNotification();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showNotifBanner, setShowNotifBanner] = useState(needsPermission);

  const focusInterval = settings?.focusInterval ?? 25;
  const notifiedAt = useRef<number | null>(null);

  const tasks = data?.tasks ?? [];
  const activeTasks = tasks.filter(
    (t) => t.status === "queued" || t.status === "active",
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const dayTasks = activeTasks.filter((t) => t.session === "day");
  const nightTasks = activeTasks.filter((t) => t.session === "night");

  const runningTask = activeTasks.find((t) => t.status === "active");

  function getSessionElapsed(task: (typeof tasks)[number]): number {
    const running = task.sessions?.find(
      (s: { status: string }) => s.status === "running",
    );
    if (!running) return 0;
    return Math.floor(
      (Date.now() - new Date(running.startTime).getTime()) / 1000,
    );
  }

  useEffect(() => {
    if (runningTask && !activeTaskId && !timer.isRunning) {
      setActiveTaskId(runningTask.id);
      timer.start(getSessionElapsed(runningTask));
    }
  }, [runningTask?.id, activeTaskId, timer.isRunning]);

  const activeDuration = activeTasks.find(
    (t) => t.id === activeTaskId,
  )?.durationMin;

  useEffect(() => {
    if (!timer.isRunning || !activeTaskId) return;
    const intervalSeconds = (activeDuration ?? focusInterval) * 60;
    if (
      timer.elapsed >= intervalSeconds &&
      notifiedAt.current !== intervalSeconds
    ) {
      const task = activeTasks.find((t) => t.id === activeTaskId);
      if (task) {
        notify(
          "Focus interval complete",
          `You've been working on ${task.title} for ${task.durationMin} minutes`,
        );
      }
      notifiedAt.current = intervalSeconds;
      handleComplete(activeTaskId);
    }
  }, [
    timer.elapsed,
    timer.isRunning,
    activeTaskId,
    activeDuration,
    focusInterval,
    activeTasks,
    notify,
  ]);

  const pendingStartRef = useRef<string | null>(null);
  const prevTaskIdsRef = useRef<string>("");

  useEffect(() => {
    if (!pendingStartRef.current) {
      prevTaskIdsRef.current = tasks.map((t) => t.id).join(",");
      return;
    }
    const pendingTempId = pendingStartRef.current;

    // Temp ID still in list — not replaced yet
    if (tasks.some((t) => t.id === pendingTempId)) {
      prevTaskIdsRef.current = tasks.map((t) => t.id).join(",");
      return;
    }

    // Temp ID gone — find the new real ID that replaced it
    const prevIds = new Set(prevTaskIdsRef.current.split(","));
    const newRealTask = tasks.find(
      (t) => !prevIds.has(t.id) && !t.id.startsWith("temp-"),
    );

    if (newRealTask) {
      pendingStartRef.current = null;
      setActiveTaskId(newRealTask.id);
      updateTask.mutate({ taskId: newRealTask.id, body: { status: "active" } });
    }

    prevTaskIdsRef.current = tasks.map((t) => t.id).join(",");
  }, [tasks]);

  function handleStart(taskId: string) {
    if (taskId.startsWith("temp-")) {
      pendingStartRef.current = taskId;
      // Optimistically set temp task to active in cache
      queryClient.setQueryData<DayData>(["day", date], (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) =>
            t.id === taskId ? ({ ...t, status: "active" } as DayTask) : t,
          ),
        };
      });
      setActiveTaskId(taskId);
      notifiedAt.current = null;
      timer.start();
      return;
    }
    updateTask.mutate({ taskId, body: { status: "active" } });
    setActiveTaskId(taskId);
    notifiedAt.current = null;
    timer.start();
  }

  function handlePause(taskId: string) {
    updateTask.mutate({ taskId, body: { status: "queued" } });
    timer.pause();
  }

  function handleComplete(taskId: string) {
    updateTask.mutate({ taskId, body: { status: "completed" } });
    timer.reset();
    setActiveTaskId(null);
  }

  return (
    <div className="space-y-8">
      <PlaylistHeader
        date={date!}
        taskCount={tasks.length}
        onBack={() => navigate("/")}
      />

      {showNotifBanner && (
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            Get notified when focus sessions end
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await requestPermission();
                setShowNotifBanner(false);
              }}
              className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Enable
            </button>
            <button
              onClick={() => setShowNotifBanner(false)}
              className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <AddTaskInput
        defaultDuration={focusInterval}
        onAdd={(title, durationMin) => addTask.mutate({ title, durationMin })}
      />

      <TaskGroup
        label="Day"
        tasks={dayTasks}
        activeTaskId={activeTaskId}
        timerElapsed={timer.elapsed}
        timerIsRunning={timer.isRunning}
        onStart={handleStart}
        onPause={handlePause}
        onComplete={handleComplete}
        onDelete={(id) => deleteTask.mutate(id)}
        onReorder={(ids) => reorderTasks.mutate(ids)}
      />

      {nightTasks.length > 0 && (
        <div className="pt-4">
          <TaskGroup
            label="Night"
            tasks={nightTasks}
            activeTaskId={activeTaskId}
            timerElapsed={timer.elapsed}
            timerIsRunning={timer.isRunning}
            onStart={handleStart}
            onPause={handlePause}
            onComplete={handleComplete}
            onDelete={(id) => deleteTask.mutate(id)}
            onReorder={(ids) => reorderTasks.mutate(ids)}
          />
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-1 pt-6 border-t border-border/50">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Completed
          </p>
          {completedTasks.map((task, i) => (
            <div
              key={task.id}
              className="animate-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <TaskItem
                task={task}
                onStart={() => handleStart(task.id)}
                onPause={() => handlePause(task.id)}
                onComplete={() => handleComplete(task.id)}
                onDelete={() => deleteTask.mutate(task.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
