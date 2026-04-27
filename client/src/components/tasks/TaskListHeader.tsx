type TaskListHeaderProps = {
  count: number;
};
export default function TaskListHeader({ count }: TaskListHeaderProps) {
  return (
    <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
      {count} {count === 1 ? "task" : "tasks"}
    </p>
  );
}
