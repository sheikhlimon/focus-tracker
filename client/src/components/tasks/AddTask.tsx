import React from "react";

type AddTaskProps = {
  onAddTask: (taskName: string) => void;
};

export default function AddTask({ onAddTask }: AddTaskProps) {
  const [taskName, setTaskName] = React.useState("");

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskName.trim()) return; // ignore empty tasks

    onAddTask(taskName);
    setTaskName("");
  };

  return (
    <form onSubmit={handleAddTask} className="flex space-x-2 mb-6">
      <input
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        id="task-input"
        aria-label="Add task"
        className="flex-1 px-3 py-2 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        placeholder="Add a new task..."
      />
      <button
        type="submit"
        className="px-3 py-2 sm:px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
      >
        Add
      </button>
    </form>
  );
}
