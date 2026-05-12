import { useRef } from "react";
import { Plus } from "lucide-react";

interface AddTaskInputProps {
  onAdd: (title: string) => void;
}

export default function AddTaskInput({ onAdd }: AddTaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    const trimmed = (formData.get("title") as string).trim();
    if (!trimmed) return;
    onAdd(trimmed);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <form action={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        name="title"
        placeholder="Add a task..."
        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
      />
      <button
        type="submit"
        aria-label="Add task"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
      >
        <Plus className="size-4" />
      </button>
    </form>
  );
}
