import { useState, useEffect, useRef } from "react";
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
import {
  useDay,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useReorderTasks,
  useSettings,
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
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    animationDelay: `${index * 50}ms`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="animate-in"
      {...attributes}
      {...listeners}
    >
      <TaskItem task={task} {...props} />
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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  }

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, i) => (
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

  const { data } = useDay(date!);
  const { data: settings } = useSettings();
  const addTask = useAddTask(date!);
  const updateTask = useUpdateTask(date!);
  const deleteTask = useDeleteTask(date!);
  const reorderTasks = useReorderTasks(date!);

  const timer = useTimer();
  const { notify } = useNotification();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

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
      handlePause(activeTaskId);
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

  useEffect(() => {
    if (!pendingStartRef.current) return;
    const pendingTitle = pendingStartRef.current;
    const realTask = tasks.find(
      (t) =>
        !t.id.startsWith("temp-") &&
        t.title === pendingTitle &&
        t.status === "queued",
    );
    if (realTask) {
      pendingStartRef.current = null;
      updateTask.mutate({ taskId: realTask.id, body: { status: "active" } });
      setActiveTaskId(realTask.id);
    }
  }, [tasks]);

  function handleStart(taskId: string) {
    if (taskId.startsWith("temp-")) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) pendingStartRef.current = task.title;
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
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
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
