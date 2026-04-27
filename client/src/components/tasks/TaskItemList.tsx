import type { Task } from "../../types";
import { Trash2 } from "lucide-react";

type TaskListItemProps = {
  task: Task;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
};

export default function TaskListItem({ task, onToggleTask, onDeleteTask }: TaskListItemProps) {
  return (
    <li className="flex items-center space-x-3 py-2">
      <input
        type="checkbox"
        checked={task.isCompleted}
        onChange={() => onToggleTask(task.id)}
        aria-label={task.title}
        className="w-5 h-5 text-indigo-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md"
      />
      <span
        className={`flex-1 text-black dark:text-white ${
          task.isCompleted ? "line-through opacity-50" : ""
        }`}
      >
        {task.title}
      </span>
      <button
        onClick={() => onDeleteTask(task.id)}
        aria-label={`Delete ${task.title}`}
        className="w-6 h-6 text-gray-400 hover:text-white hover:bg-red-600 rounded-md focus:outline-none transition-colors flex items-center justify-center cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}
