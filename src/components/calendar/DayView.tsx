import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobListItem, type JobWithRelations } from "@/components/jobs/JobListItem";

export function DayView({ jobs }: { jobs: JobWithRelations[] }) {
  if (jobs.length === 0) {
    return <EmptyState title="No jobs scheduled" description="Tap “Job” to add one." />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-border">
        {jobs.map((job) => (
          <JobListItem key={job.id} job={job} />
        ))}
      </div>
    </Card>
  );
}
