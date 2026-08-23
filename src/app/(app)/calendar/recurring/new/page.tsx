import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { RecurringJobForm } from "@/components/jobs/RecurringJobForm";
import { listCustomers } from "@/server/data/customers";
import { listActiveStaff } from "@/server/data/staff";
import { createRecurringJob } from "@/server/data/recurring-actions";

export default async function NewRecurringJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const [customers, staff] = await Promise.all([listCustomers(), listActiveStaff()]);

  return (
    <div>
      <PageHeader
        title="Set up a recurring job"
        description="Ava will keep the calendar filled with future visits automatically."
      />
      <Card>
        <CardContent>
          <RecurringJobForm
            action={createRecurringJob}
            customers={customers}
            staff={staff}
            defaultCustomerId={customerId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
