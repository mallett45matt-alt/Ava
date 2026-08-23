import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, MapPin, Phone, Pencil, Repeat } from "lucide-react";
import { getCustomer } from "@/server/data/customers";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCents, formatDateTime } from "@/lib/format";
import { jobStatusMeta, quoteStatusMeta, invoiceStatusMeta } from "@/lib/status";
import { splitUpcomingPastJobs } from "@/lib/jobs";

function quoteTotalCents(items: { quantity: number; unitPriceCents: number }[]) {
  return items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPriceCents), 0);
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const { upcoming: upcomingJobs, past: pastJobs } = splitUpcomingPastJobs(customer.jobs);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        action={
          <ButtonLink href={`/customers/${customer.id}/edit`} variant="secondary" size="sm">
            <Pencil size={16} /> Edit
          </ButtonLink>
        }
      />

      <Card>
        <CardContent className="space-y-2.5">
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-2.5 text-sm hover:text-accent"
            >
              <Phone size={16} className="text-muted" /> {customer.phone}
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-2.5 text-sm hover:text-accent"
            >
              <Mail size={16} className="text-muted" /> {customer.email}
            </a>
          )}
          {customer.address && (
            <p className="flex items-center gap-2.5 text-sm">
              <MapPin size={16} className="text-muted" /> {customer.address}
            </p>
          )}
          {!customer.phone && !customer.email && !customer.address && (
            <p className="text-sm text-muted">No contact details yet.</p>
          )}
          {customer.notes && (
            <p className="whitespace-pre-wrap rounded-xl bg-background px-3.5 py-2.5 text-sm text-muted">
              {customer.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {customer.recurringJobs.filter((r) => r.active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recurring services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.recurringJobs
              .filter((r) => r.active)
              .map((recurring) => (
                <div key={recurring.id} className="flex items-center gap-2.5 text-sm">
                  <Repeat size={16} className="shrink-0 text-muted" />
                  <span>
                    {recurring.description} — every {recurring.intervalValue}{" "}
                    {recurring.intervalUnit.toLowerCase()}
                    {recurring.intervalValue > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upcoming jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingJobs.length === 0 ? (
            <EmptyState title="No upcoming jobs" description="Schedule one from the calendar." />
          ) : (
            <ul className="divide-y divide-border">
              {upcomingJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.description}</p>
                    <p className="text-sm text-muted">{formatDateTime(job.scheduledAt)}</p>
                  </div>
                  <Badge tone={jobStatusMeta[job.status].tone}>{jobStatusMeta[job.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job history</CardTitle>
        </CardHeader>
        <CardContent>
          {pastJobs.length === 0 ? (
            <EmptyState title="No past jobs yet" />
          ) : (
            <ul className="divide-y divide-border">
              {pastJobs.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.description}</p>
                    <p className="text-sm text-muted">{formatDateTime(job.scheduledAt)}</p>
                  </div>
                  <Badge tone={jobStatusMeta[job.status].tone}>{jobStatusMeta[job.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.quotes.length === 0 ? (
            <EmptyState title="No quotes yet" />
          ) : (
            <ul className="divide-y divide-border">
              {customer.quotes.map((quote) => (
                <li key={quote.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{quote.description}</p>
                    <p className="text-sm text-muted">{formatCents(quoteTotalCents(quote.items))}</p>
                  </div>
                  <Badge tone={quoteStatusMeta[quote.status].tone}>
                    {quoteStatusMeta[quote.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.invoices.length === 0 ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <ul className="divide-y divide-border">
              {customer.invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      Invoice — {formatDateTime(invoice.issueDate)}
                    </p>
                    <p className="text-sm text-muted">{formatCents(quoteTotalCents(invoice.items))}</p>
                  </div>
                  <Badge tone={invoiceStatusMeta[invoice.status].tone}>
                    {invoiceStatusMeta[invoice.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted">
        <Link href="/customers" className="hover:text-accent">
          ← Back to all customers
        </Link>
      </p>
    </div>
  );
}
