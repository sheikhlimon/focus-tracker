import React from "react";
import AddTask from "./components/tasks/AddTask";
import TaskList from "./components/tasks/TaskList";
import type { Task } from "./types";
import TaskListItem from "./components/tasks/TaskItemList";
import TaskListHeader from "./components/tasks/TaskListHeader";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme/useTheme";

function App() {
  // acting db for tasks
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const { theme, toggleTheme } = useTheme();

  const onAddTask = (taskName: string) => {
    setTasks([
      ...tasks,
      { id: Date.now(), title: taskName, isCompleted: false }, // Date.now() is just a placeholder -> real db handles this automatically
    ]);
  };

  const onToggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task,
      ),
    );
  };

  const onDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-8 max-w-md w-full relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 w-8 h-8 text-gray-600 hover:text-gray-800 dark:text-yellow-400 dark:hover:text-yellow-300 focus:outline-none transition-colors flex items-center justify-center cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-8 text-black dark:text-white">
          Tasks
        </h1>
        <AddTask onAddTask={onAddTask} />
        <TaskList header={<TaskListHeader count={tasks.length} />}>
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </TaskList>
      </div>
    </div>
  );
}

export default App;
