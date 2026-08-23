import Link from "next/link";
import { Repeat } from "lucide-react";
import { listRecurringJobs } from "@/server/data/recurring";
import { setRecurringActive } from "@/server/data/recurring-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink, Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export default async function RecurringJobsPage() {
  const recurringJobs = await listRecurringJobs();

  return (
    <div>
      <PageHeader
        title="Recurring jobs"
        description="Templates that keep generating future visits on the calendar."
        action={<ButtonLink href="/calendar/recurring/new">New recurring job</ButtonLink>}
      />

      {recurringJobs.length === 0 ? (
        <EmptyState
          icon={<Repeat size={28} />}
          title="No recurring jobs yet"
          description="Set one up for a customer you service on a schedule."
          action={<ButtonLink href="/calendar/recurring/new">New recurring job</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {recurringJobs.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <Link href={`/customers/${r.customerId}`} className="truncate font-medium hover:text-accent">
                  {r.customer.name}
                </Link>
                <p className="truncate text-sm text-muted">
                  {r.description} — every {r.intervalValue} {r.intervalUnit.toLowerCase()}
                  {r.intervalValue > 1 ? "s" : ""}
                  {r.assignedStaff ? ` · ${r.assignedStaff.name}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!r.active && <Badge tone="neutral">Paused</Badge>}
                <form action={setRecurringActive.bind(null, r.id, !r.active)}>
                  <Button type="submit" variant="ghost" size="sm">
                    {r.active ? "Pause" : "Resume"}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
