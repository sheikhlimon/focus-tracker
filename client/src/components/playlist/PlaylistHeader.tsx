import { ArrowLeft } from "lucide-react";

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
    <div className="flex items-center justify-between pb-6 border-b border-border/50">
      <div>
        <button
          onClick={onBack}
          aria-label="Back to calendar"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="size-3.5" />
          Calendar
        </button>
        <h2 className="text-2xl font-bold tracking-tight">{formatted}</h2>
        <p className="text-[13px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
