import { listJobsInRange } from "@/server/data/jobs";
import { ensureRecurringJobsGenerated } from "@/server/data/recurring";
import { CalendarNav } from "@/components/calendar/CalendarNav";
import { DayView } from "@/components/calendar/DayView";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import {
  endOfLocalDay,
  getMonthGrid,
  getWeekDays,
  parseDateParam,
  startOfLocalDay,
  startOfWeek,
  type CalendarView,
} from "@/lib/calendar";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const params = await searchParams;
  const view: CalendarView =
    params.view === "day" || params.view === "month" ? params.view : "week";
  const date = parseDateParam(params.date);

  await ensureRecurringJobsGenerated();

  if (view === "day") {
    const jobs = await listJobsInRange(startOfLocalDay(date), endOfLocalDay(date));
    return (
      <div>
        <CalendarNav view={view} date={date} />
        <DayView jobs={jobs} />
      </div>
    );
  }

  if (view === "month") {
    const gridDays = getMonthGrid(date);
    const jobs = await listJobsInRange(
      startOfLocalDay(gridDays[0]),
      endOfLocalDay(gridDays[gridDays.length - 1]),
    );
    return (
      <div>
        <CalendarNav view={view} date={date} />
        <MonthView monthDate={date} gridDays={gridDays} jobs={jobs} />
      </div>
    );
  }

  const days = getWeekDays(date);
  const jobs = await listJobsInRange(startOfWeek(date), endOfLocalDay(days[6]));
  return (
    <div>
      <CalendarNav view={view} date={date} />
      <WeekView days={days} jobs={jobs} />
    </div>
  );
}
