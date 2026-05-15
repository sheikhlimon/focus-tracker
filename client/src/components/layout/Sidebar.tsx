import { useMonth } from "../../api/queries";
import { getLocalDate } from "../../lib/utils";
import DateCard from "../calendar/DateCard";

interface SidebarProps {
  month: string;
}

export default function Sidebar({ month }: SidebarProps) {
  const { data } = useMonth(month);
  const days = data?.days ?? [];

  const today = getLocalDate();

  const todayDays = days.filter((d) => d.date === today);
  const upcoming = days.filter(
    (d) => d.date > today && d.date.startsWith(month),
  );
  const past = days.filter((d) => d.date < today && d.date.startsWith(month));

  const isEmpty =
    todayDays.length === 0 && upcoming.length === 0 && past.length === 0;

  return (
    <aside className="w-72 bg-sidebar p-5 space-y-8 overflow-y-auto">
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground/50">No sessions yet.</p>
          <p className="mt-1 text-xs text-muted-foreground/30">
            Create a task to get started.
          </p>
        </div>
      )}
      {todayDays.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Today
          </h3>
          {todayDays.map((d) => (
            <DateCard
              key={d.date}
              date={d.date}
              taskCount={d.taskCount}
              isToday
              showDayName
            />
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Upcoming
          </h3>
          <div className="space-y-1">
            {upcoming.map((d) => (
              <DateCard
                key={d.date}
                date={d.date}
                taskCount={d.taskCount}
                showDayName
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Past
          </h3>
          <div className="space-y-1 opacity-60">
            {past.map((d) => (
              <DateCard
                key={d.date}
                date={d.date}
                taskCount={d.taskCount}
                showDayName
              />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
