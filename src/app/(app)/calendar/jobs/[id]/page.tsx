import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, MapPin, Clock, User, Repeat } from "lucide-react";
import { getJob } from "@/server/data/jobs";
import { setJobStatus } from "@/server/data/jobs-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCents, formatDateLong, formatDurationMin, formatTime } from "@/lib/format";
import { jobStatusMeta } from "@/lib/status";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const meta = jobStatusMeta[job.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.description}
        description={`${formatDateLong(job.scheduledAt)} at ${formatTime(job.scheduledAt)}`}
        action={
          <ButtonLink href={`/calendar/jobs/${job.id}/edit`} variant="secondary" size="sm">
            <Pencil size={16} /> Edit
          </ButtonLink>
        }
      />

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {job.recurringJobId && (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Repeat size={14} /> Recurring
              </span>
            )}
          </div>

          <Link
            href={`/customers/${job.customerId}`}
            className="block text-base font-medium hover:text-accent"
          >
            {job.customer.name}
          </Link>

          {job.address && (
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <MapPin size={16} /> {job.address}
            </p>
          )}
          <p className="flex items-center gap-2.5 text-sm text-muted">
            <Clock size={16} /> {formatDurationMin(job.estimatedDurationMin)}
          </p>
          {job.assignedStaff && (
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <User size={16} /> {job.assignedStaff.name}
            </p>
          )}
          {job.priceCents != null && (
            <p className="text-sm text-muted">Price: {formatCents(job.priceCents)}</p>
          )}
          {job.internalNotes && (
            <p className="whitespace-pre-wrap rounded-xl bg-background px-3.5 py-2.5 text-sm text-muted">
              {job.internalNotes}
            </p>
          )}
        </CardContent>
      </Card>

      {job.status !== "CANCELLED" && job.status !== "COMPLETED" && (
        <div className="flex flex-wrap gap-2">
          {job.status === "SCHEDULED" && (
            <form action={setJobStatus.bind(null, job.id, "IN_PROGRESS")}>
              <Button type="submit" variant="secondary">
                Start job
              </Button>
            </form>
          )}
          <form action={setJobStatus.bind(null, job.id, "COMPLETED")}>
            <Button type="submit">Mark completed</Button>
          </form>
          <form action={setJobStatus.bind(null, job.id, "CANCELLED")}>
            <Button type="submit" variant="ghost">
              Cancel job
            </Button>
          </form>
        </div>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/calendar" className="hover:text-accent">
          ← Back to calendar
        </Link>
      </p>
    </div>
  );
}
