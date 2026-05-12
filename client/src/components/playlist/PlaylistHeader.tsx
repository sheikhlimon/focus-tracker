interface PlaylistHeaderProps {
  date: string;
  taskCount: number;
  onBack: () => void;
}

export default function PlaylistHeader({
  date,
  taskCount,
  onBack,
}: PlaylistHeaderProps) {
  const [year, month, day] = date.split("-").map(Number);
  const formatted = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  );

  const label = taskCount === 1 ? "1 task" : `${taskCount} tasks`;

  return (
    <div className="flex items-center justify-between pb-4 border-b border-border">
      <div>
        <button
          onClick={onBack}
          aria-label="Back to calendar"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-1"
        >
          &larr; Calendar
        </button>
        <h2 className="text-xl font-semibold tracking-tight">{formatted}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
