import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
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

  const runningTask = activeTasks.find((t) => t.status === "active");

  useEffect(() => {
    if (runningTask && !activeTaskId && !timer.isRunning) {
      setActiveTaskId(runningTask.id);
      timer.start();
    }
  }, [runningTask?.id, activeTaskId, timer.isRunning]);

  useEffect(() => {
    if (!timer.isRunning || !activeTaskId) return;
    const intervalSeconds = focusInterval * 60;
    if (
      timer.elapsed >= intervalSeconds &&
      notifiedAt.current !== intervalSeconds
    ) {
      const task = activeTasks.find((t) => t.id === activeTaskId);
      if (task) {
        notify(
          "Focus interval complete",
          `You've been working on ${task.title} for ${focusInterval} minutes`,
        );
      }
      notifiedAt.current = intervalSeconds;
    }
  }, [
    timer.elapsed,
    timer.isRunning,
    activeTaskId,
    focusInterval,
    activeTasks,
    notify,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeTasks.findIndex((t) => t.id === active.id);
    const newIndex = activeTasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    reorderTasks.mutate(reordered.map((t) => t.id));
  }

  function handleStart(taskId: string) {
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

      <AddTaskInput onAdd={(title) => addTask.mutate({ title })} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {activeTasks.map((task, i) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                index={i}
                elapsed={activeTaskId === task.id ? timer.elapsed : 0}
                isTimerRunning={activeTaskId === task.id && timer.isRunning}
                focusInterval={focusInterval}
                onStart={() => handleStart(task.id)}
                onPause={() => handlePause(task.id)}
                onComplete={() => handleComplete(task.id)}
                onDelete={() => deleteTask.mutate(task.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
