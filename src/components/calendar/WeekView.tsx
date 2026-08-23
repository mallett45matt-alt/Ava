import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { JobListItem, type JobWithRelations } from "@/components/jobs/JobListItem";
import { cn } from "@/lib/utils";
import { dateParam, isSameLocalDay } from "@/lib/calendar";

export function WeekView({ days, jobs }: { days: Date[]; jobs: JobWithRelations[] }) {
  const today = new Date();

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const dayJobs = jobs.filter((job) => isSameLocalDay(job.scheduledAt, day));
        const isToday = isSameLocalDay(day, today);
        return (
          <Card key={day.toISOString()} className="overflow-hidden">
            <Link
              href={`/calendar?view=day&date=${dateParam(day)}`}
              className={cn(
                "flex items-center justify-between px-4 py-2.5 text-sm font-semibold",
                isToday ? "bg-accent-soft text-accent" : "bg-background text-foreground",
              )}
            >
              {day.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
              {dayJobs.length > 0 && (
                <span className="font-normal text-muted">
                  {dayJobs.length} job{dayJobs.length === 1 ? "" : "s"}
                </span>
              )}
            </Link>
            {dayJobs.length > 0 && (
              <div className="divide-y divide-border">
                {dayJobs.map((job) => (
                  <JobListItem key={job.id} job={job} />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
