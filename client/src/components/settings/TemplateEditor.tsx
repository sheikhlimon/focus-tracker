import { useState } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useTemplates,
  useAddTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useReorderTemplates,
} from "../../api/queries";
import TemplateItem, { type TemplateItemData } from "./TemplateItem";

function SortableTemplate({
  template,
  onUpdate,
  onDelete,
}: {
  template: TemplateItemData;
  onUpdate: (id: string, body: Partial<TemplateItemData>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: template.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TemplateItem
        template={template}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}

function AddForm({
  session,
  onAdd,
}: {
  session: "day" | "night";
  onAdd: (data: {
    title: string;
    durationMin: number;
    session: "day" | "night";
    url?: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      durationMin: duration,
      session,
      url: url.trim() || undefined,
    });
    setTitle("");
    setDuration(30);
    setUrl("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add activity..."
        className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
      />
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (optional)"
        className="w-32 rounded-lg border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        min={1}
        max={480}
        className="w-14 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-center text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
      >
        <Plus className="size-4" />
      </button>
    </form>
  );
}

export default function TemplateEditor() {
  const { data } = useTemplates();
  const addTemplate = useAddTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const reorderTemplates = useReorderTemplates();

  const templates = data?.templates ?? [];
  const dayTemplates = templates.filter(
    (t): t is TemplateItemData => t.session === "day",
  );
  const nightTemplates = templates.filter(
    (t): t is TemplateItemData => t.session === "night",
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(
    session: "day" | "night",
    items: TemplateItemData[],
    event: DragEndEvent,
  ) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    reorderTemplates.mutate({
      session,
      templateIds: reordered.map((t) => t.id),
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="px-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Day
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd("day", dayTemplates, e)}
        >
          <SortableContext
            items={dayTemplates.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {dayTemplates.map((t) => (
                <SortableTemplate
                  key={t.id}
                  template={t}
                  onUpdate={(id, body) =>
                    updateTemplate.mutate({
                      templateId: id,
                      body: { ...body, url: body.url ?? undefined },
                    })
                  }
                  onDelete={(id) => deleteTemplate.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <AddForm session="day" onAdd={(d) => addTemplate.mutate(d)} />
      </section>

      <section className="space-y-3">
        <h3 className="px-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Night
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd("night", nightTemplates, e)}
        >
          <SortableContext
            items={nightTemplates.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {nightTemplates.map((t) => (
                <SortableTemplate
                  key={t.id}
                  template={t}
                  onUpdate={(id, body) =>
                    updateTemplate.mutate({
                      templateId: id,
                      body: { ...body, url: body.url ?? undefined },
                    })
                  }
                  onDelete={(id) => deleteTemplate.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <AddForm session="night" onAdd={(d) => addTemplate.mutate(d)} />
      </section>
    </div>
  );
}
