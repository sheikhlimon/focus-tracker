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
} from "../../api/queries";
import type { TaskItemProps } from "./TaskItem";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import PlaylistHeader from "./PlaylistHeader";

function SortableTaskItem({ task, ...props }: TaskItemProps) {
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
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} {...props} />
    </div>
  );
}

export default function PlaylistView() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const { data } = useDay(date!);
  const addTask = useAddTask(date!);
  const updateTask = useUpdateTask(date!);
  const deleteTask = useDeleteTask(date!);
  const reorderTasks = useReorderTasks(date!);

  const tasks = data?.tasks ?? [];
  const activeTasks = tasks.filter(
    (t) => t.status === "queued" || t.status === "active",
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");

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

  function handleStart(taskId: number) {
    updateTask.mutate({ taskId, body: { status: "active" } });
  }

  function handlePause(taskId: number) {
    updateTask.mutate({ taskId, body: { status: "queued" } });
  }

  function handleComplete(taskId: number) {
    updateTask.mutate({ taskId, body: { status: "completed" } });
  }

  return (
    <div className="space-y-6">
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
            {activeTasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
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
        <div className="space-y-1 pt-4 border-t border-border">
          <p className="px-4 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Completed
          </p>
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStart={() => handleStart(task.id)}
              onPause={() => handlePause(task.id)}
              onComplete={() => handleComplete(task.id)}
              onDelete={() => deleteTask.mutate(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
