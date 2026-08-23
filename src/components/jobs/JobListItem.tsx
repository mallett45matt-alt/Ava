import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatTime } from "@/lib/format";
import { jobStatusMeta } from "@/lib/status";
import type { Job, Customer, StaffMember, JobStatus } from "@prisma/client";

export type JobWithRelations = Job & {
  customer: Customer;
  assignedStaff: StaffMember | null;
};

export function JobListItem({ job }: { job: JobWithRelations }) {
  const meta = jobStatusMeta[job.status as JobStatus];
  return (
    <Link
      href={`/calendar/jobs/${job.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
    >
      <div className="w-14 shrink-0 text-sm font-medium text-muted">{formatTime(job.scheduledAt)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{job.customer.name}</p>
        <p className="truncate text-sm text-muted">
          {job.description}
          {job.assignedStaff ? ` · ${job.assignedStaff.name}` : ""}
        </p>
      </div>
      <Badge tone={meta.tone} className="shrink-0">
        {meta.label}
      </Badge>
    </Link>
  );
}
