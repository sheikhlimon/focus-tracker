import { useState, useMemo } from "react";

interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
}

function formatDay(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function generateGrid(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const startDow = firstDay.getUTCDay();

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const days: CalendarDay[] = [];

  // Leading days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: formatDay(y, m, d), isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: formatDay(year, month, d), isCurrentMonth: true });
  }

  // Trailing days to fill 42 cells
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: formatDay(y, m, d), isCurrentMonth: false });
  }

  return days;
}

function formatLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function useCalendar(initialMonth: string) {
  const [month, setMonth] = useState(initialMonth);

  const [year, rawMonth] = month.split("-").map(Number);
  const mon = rawMonth - 1;

  const days = useMemo(() => generateGrid(year, mon), [year, mon]);
  const label = useMemo(() => formatLabel(year, mon), [year, mon]);

  function nextMonth() {
    const next =
      mon === 11
        ? `${year + 1}-01`
        : `${year}-${String(mon + 2).padStart(2, "0")}`;
    setMonth(next);
  }

  function prevMonth() {
    const prev =
      mon === 0 ? `${year - 1}-12` : `${year}-${String(mon).padStart(2, "0")}`;
    setMonth(prev);
  }

  return { month, days, label, nextMonth, prevMonth };
}
