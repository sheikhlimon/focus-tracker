import { useMonth } from "../../api/queries";
import DateCard from "../calendar/DateCard";

interface SidebarProps {
  month: string;
}

export default function Sidebar({ month }: SidebarProps) {
  const { data } = useMonth(month);
  const days = data?.days ?? [];

  const today = new Date().toISOString().slice(0, 10);

  const todayDays = days.filter((d) => d.date === today);
  const upcoming = days.filter(
    (d) => d.date > today && d.date.startsWith(month),
  );
  const past = days.filter((d) => d.date < today && d.date.startsWith(month));

  return (
    <aside className="w-72 bg-sidebar p-5 space-y-8 overflow-y-auto">
      {todayDays.length > 0 && (
        <section>
          <h3 className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
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
          <h3 className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
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
          <h3 className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
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
