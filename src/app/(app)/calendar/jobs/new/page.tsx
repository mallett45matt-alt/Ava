import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { JobForm } from "@/components/jobs/JobForm";
import { listCustomers } from "@/server/data/customers";
import { listActiveStaff } from "@/server/data/staff";
import { createJob } from "@/server/data/jobs-actions";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; date?: string }>;
}) {
  const { customerId, date } = await searchParams;
  const [customers, staff] = await Promise.all([listCustomers(), listActiveStaff()]);

  return (
    <div>
      <PageHeader title="Schedule a job" />
      <Card>
        <CardContent>
          <JobForm
            action={createJob}
            customers={customers}
            staff={staff}
            submitLabel="Schedule job"
            defaults={{ customerId, scheduledDate: date }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
