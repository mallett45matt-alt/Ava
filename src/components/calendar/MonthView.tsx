import Link from "next/link";
import { cn } from "@/lib/utils";
import { dateParam, isSameLocalDay } from "@/lib/calendar";
import type { JobWithRelations } from "@/components/jobs/JobListItem";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({
  monthDate,
  gridDays,
  jobs,
}: {
  monthDate: Date;
  gridDays: Date[];
  jobs: JobWithRelations[];
}) {
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="grid grid-cols-7 border-b border-border text-center text-xs font-medium text-muted">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {gridDays.map((day) => {
          const dayJobs = jobs.filter((job) => isSameLocalDay(job.scheduledAt, day));
          const inCurrentMonth = day.getMonth() === monthDate.getMonth();
          const isToday = isSameLocalDay(day, today);

          return (
            <Link
              key={day.toISOString()}
              href={`/calendar?view=day&date=${dateParam(day)}`}
              className={cn(
                "flex min-h-20 flex-col items-center gap-1 border-b border-r border-border p-1.5 last:border-r-0 sm:min-h-24",
                !inCurrentMonth && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday ? "bg-accent text-accent-foreground" : "text-foreground",
                )}
              >
                {day.getDate()}
              </span>
              {dayJobs.length > 0 && (
                <span className="rounded-full bg-accent-soft px-1.5 text-[11px] font-medium text-accent">
                  {dayJobs.length}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
