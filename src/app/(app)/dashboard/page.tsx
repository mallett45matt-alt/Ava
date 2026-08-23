import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getDashboardData } from "@/server/data/dashboard";
import { requireSession } from "@/server/auth/require";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobListItem } from "@/components/jobs/JobListItem";
import { formatCents, formatDate } from "@/lib/format";
import { lineItemsTotalCents } from "@/server/data/line-items";
import { taskPriorityMeta, quoteStatusMeta, invoiceStatusMeta } from "@/lib/status";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await requireSession();
  const { todaysJobs, upcomingJobs, openTasks, quotesAwaitingAction, outstandingInvoices, suggestions } =
    await getDashboardData();

  const firstName = session.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s what needs doing.</p>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <Card key={s.id} className="border-accent/30 bg-accent-soft">
              <CardContent className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-sm text-muted">{s.description}</p>
                  </div>
                </div>
                <ButtonLink href={s.href} size="sm" className="shrink-0">
                  {s.cta}
                </ButtonLink>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
        </CardHeader>
        <CardContent className={todaysJobs.length > 0 ? "p-0" : undefined}>
          {todaysJobs.length === 0 ? (
            <EmptyState title="No jobs today" />
          ) : (
            <div className="divide-y divide-border">
              {todaysJobs.map((job) => (
                <JobListItem key={job.id} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coming up this week</CardTitle>
        </CardHeader>
        <CardContent className={upcomingJobs.length > 0 ? "p-0" : undefined}>
          {upcomingJobs.length === 0 ? (
            <EmptyState title="Nothing else scheduled this week" />
          ) : (
            <div className="divide-y divide-border">
              {upcomingJobs.map((job) => (
                <JobListItem key={job.id} job={job} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Needs your attention</CardTitle>
        </CardHeader>
        <CardContent>
          {openTasks.length === 0 ? (
            <EmptyState title="Nothing urgent" />
          ) : (
            <ul className="divide-y divide-border">
              {openTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Link href="/tasks" className="min-w-0 text-sm hover:text-accent">
                    <span className="font-medium">{task.title}</span>
                    {task.customer && <span className="text-muted"> · {task.customer.name}</span>}
                  </Link>
                  <Badge tone={taskPriorityMeta[task.priority].tone} className="shrink-0">
                    {taskPriorityMeta[task.priority].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quotes awaiting action</CardTitle>
        </CardHeader>
        <CardContent>
          {quotesAwaitingAction.length === 0 ? (
            <EmptyState title="Nothing waiting on you" />
          ) : (
            <ul className="divide-y divide-border">
              {quotesAwaitingAction.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/money/quotes/${quote.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-accent"
                  >
                    <div className="min-w-0 text-sm">
                      <span className="font-medium">{quote.customer.name}</span>
                      <span className="text-muted"> · {quote.description}</span>
                    </div>
                    <Badge tone={quoteStatusMeta[quote.status].tone} className="shrink-0">
                      {quoteStatusMeta[quote.status].label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {outstandingInvoices.length === 0 ? (
            <EmptyState title="Nothing outstanding" />
          ) : (
            <ul className="divide-y divide-border">
              {outstandingInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/money/invoices/${invoice.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-accent"
                  >
                    <div className="min-w-0 text-sm">
                      <span className="font-medium">{invoice.customer.name}</span>
                      <span className="text-muted">
                        {" "}
                        · {formatCents(lineItemsTotalCents(invoice.items))}
                        {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
                      </span>
                    </div>
                    <Badge tone={invoiceStatusMeta[invoice.status].tone} className="shrink-0">
                      {invoiceStatusMeta[invoice.status].label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
