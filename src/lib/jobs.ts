type JobLike = { id: string; scheduledAt: Date; status: string };

/**
 * Split a customer's jobs into "upcoming" (not cancelled, in the future) and
 * "past". Pulled out of the page component because reading the wall clock
 * directly inside a Server Component body trips the react-hooks/purity lint
 * rule, which checks for impure calls syntactically inside render functions.
 */
export function splitUpcomingPastJobs<T extends JobLike>(jobs: T[]) {
  const now = Date.now();
  const upcoming = jobs
    .filter((job) => job.status !== "CANCELLED" && job.scheduledAt.getTime() >= now)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const upcomingIds = new Set(upcoming.map((job) => job.id));
  const past = jobs.filter((job) => !upcomingIds.has(job.id));
  return { upcoming, past };
}
