import { GripVertical, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TemplateItemData {
  id: string;
  title: string;
  url: string | null;
  durationMin: number;
  session: "day" | "night";
  position: number;
}

interface TemplateItemProps {
  template: TemplateItemData;
  onUpdate: (id: string, body: Partial<TemplateItemData>) => void;
  onDelete: (id: string) => void;
}

function formatDuration(min: number): string {
  if (min >= 60 && min % 60 === 0) return `${min / 60}h`;
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min}m`;
}

export default function TemplateItem({
  template,
  onUpdate,
  onDelete,
}: TemplateItemProps) {
  return (
    <div className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors">
      <div
        aria-label="Drag to reorder"
        className="flex-shrink-0 cursor-grab p-0.5 text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>

      <span
        className={cn("min-w-0 flex-1 truncate text-sm font-medium")}
        onBlur={(e) => {
          const newTitle = e.currentTarget.textContent?.trim();
          if (newTitle && newTitle !== template.title) {
            onUpdate(template.id, { title: newTitle });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLElement).blur();
          }
        }}
        contentEditable
        suppressContentEditableWarning
      >
        {template.title}
      </span>

      {template.url && (
        <a
          href={template.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}

      <span className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatDuration(template.durationMin)}
      </span>

      <button
        onClick={() => onDelete(template.id)}
        aria-label="Delete template"
        className="flex-shrink-0 rounded-lg p-1.5 text-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
