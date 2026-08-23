import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { JobForm } from "@/components/jobs/JobForm";
import { getJob } from "@/server/data/jobs";
import { listCustomers } from "@/server/data/customers";
import { listActiveStaff } from "@/server/data/staff";
import { updateJob } from "@/server/data/jobs-actions";

// Jobs are stored as a local wall-clock date+time (see jobs-actions.ts), so
// these read back the same local components rather than converting to UTC
// (toISOString), which would shift the date/time on non-UTC servers.
function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeInputValue(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, customers, staff] = await Promise.all([
    getJob(id),
    listCustomers(),
    listActiveStaff(),
  ]);
  if (!job) notFound();

  return (
    <div>
      <PageHeader title="Edit job" />
      <Card>
        <CardContent>
          <JobForm
            action={updateJob.bind(null, job.id)}
            customers={customers}
            staff={staff}
            submitLabel="Save changes"
            defaults={{
              customerId: job.customerId,
              description: job.description,
              address: job.address ?? "",
              scheduledDate: toDateInputValue(job.scheduledAt),
              scheduledTime: toTimeInputValue(job.scheduledAt),
              durationMin: job.estimatedDurationMin,
              assignedStaffId: job.assignedStaffId ?? "",
              price: job.priceCents != null ? (job.priceCents / 100).toFixed(2) : "",
              internalNotes: job.internalNotes ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
