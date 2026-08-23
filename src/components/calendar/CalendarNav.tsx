import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  addWeeks,
  dateParam,
  getWeekDays,
  type CalendarView,
} from "@/lib/calendar";

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function formatTitle(view: CalendarView, date: Date): string {
  if (view === "day") {
    return date.toLocaleDateString("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (view === "month") {
    return date.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  }
  const days = getWeekDays(date);
  const start = days[0];
  const end = days[6];
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString("en-AU", { day: "numeric", month: sameMonth ? undefined : "short" });
  const endLabel = end.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

function shift(view: CalendarView, date: Date, direction: 1 | -1): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "month") return addMonths(date, direction);
  return addWeeks(date, direction);
}

export function CalendarNav({ view, date }: { view: CalendarView; date: Date }) {
  const prevHref = `/calendar?view=${view}&date=${dateParam(shift(view, date, -1))}`;
  const nextHref = `/calendar?view=${view}&date=${dateParam(shift(view, date, 1))}`;
  const todayHref = `/calendar?view=${view}&date=${dateParam(new Date())}`;

  return (
    <div className="mb-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{formatTitle(view, date)}</h1>
        <ButtonLink href="/calendar/jobs/new" size="sm">
          <Plus size={16} /> Job
        </ButtonLink>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`/calendar?view=${v.key}&date=${dateParam(date)}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                v.key === view ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground",
              )}
            >
              {v.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={prevHref}
            aria-label="Previous"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
          >
            <ChevronLeft size={18} />
          </Link>
          <Link
            href={todayHref}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            Today
          </Link>
          <Link
            href={nextHref}
            aria-label="Next"
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/calendar/recurring" className="text-sm font-medium text-accent">
          Recurring jobs →
        </Link>
      </div>
    </div>
  );
}
