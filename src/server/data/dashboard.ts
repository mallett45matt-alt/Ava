import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { ensureRecurringJobsGenerated } from "@/server/data/recurring";
import { markOverdueInvoices } from "@/server/data/invoices";
import { startOfLocalDay, endOfLocalDay, addDays } from "@/lib/calendar";

const QUIET_WEEK_JOB_THRESHOLD = 3;
const LAPSED_CUSTOMER_DAYS = 45;
const QUOTE_FOLLOWUP_DAYS = 5;

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export async function getDashboardData() {
  const session = await requireSession();

  // Self-heal: top up recurring jobs and flag anything now overdue, the
  // same way the calendar does, so the dashboard is never stale.
  await Promise.all([ensureRecurringJobsGenerated(), markOverdueInvoices()]);

  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const weekEnd = endOfLocalDay(addDays(now, 6));

  const [todaysJobs, upcomingJobs, openTasks, quotesAwaitingAction, outstandingInvoices, weekJobCount] =
    await Promise.all([
      prisma.job.findMany({
        where: {
          businessId: session.businessId,
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
        orderBy: { scheduledAt: "asc" },
        include: { customer: true, assignedStaff: true },
      }),
      prisma.job.findMany({
        where: {
          businessId: session.businessId,
          scheduledAt: { gt: todayEnd, lte: weekEnd },
          status: { not: "CANCELLED" },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: { customer: true, assignedStaff: true },
      }),
      prisma.task.findMany({
        where: {
          businessId: session.businessId,
          status: "OPEN",
          OR: [{ dueDate: { lte: todayEnd } }, { priority: "HIGH" }],
        },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
        take: 5,
        include: { customer: true },
      }),
      prisma.quote.findMany({
        where: { businessId: session.businessId, status: { in: ["DRAFT", "SENT"] } },
        orderBy: { createdAt: "asc" },
        take: 5,
        include: { customer: true, items: true },
      }),
      prisma.invoice.findMany({
        where: { businessId: session.businessId, status: { in: ["SENT", "OVERDUE"] } },
        orderBy: { dueDate: { sort: "asc", nulls: "last" } },
        take: 5,
        include: { customer: true, items: true },
      }),
      prisma.job.count({
        where: {
          businessId: session.businessId,
          scheduledAt: { gte: todayStart, lte: weekEnd },
          status: { not: "CANCELLED" },
        },
      }),
    ]);

  const suggestions = await buildSuggestions(session.businessId, weekJobCount, outstandingInvoices, quotesAwaitingAction);

  return {
    todaysJobs,
    upcomingJobs,
    openTasks,
    quotesAwaitingAction,
    outstandingInvoices,
    suggestions,
  };
}

async function buildSuggestions(
  businessId: string,
  weekJobCount: number,
  outstandingInvoices: { id: string; dueDate: Date | null }[],
  quotesAwaitingAction: { id: string; status: string; createdAt: Date; customer: { name: string }; description: string }[],
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const now = new Date();

  if (weekJobCount < QUIET_WEEK_JOB_THRESHOLD) {
    const cutoff = addDays(now, -LAPSED_CUSTOMER_DAYS);
    const lapsedCustomers = await prisma.customer.findMany({
      where: {
        businessId,
        jobs: { some: { scheduledAt: { lt: cutoff }, status: "COMPLETED" } },
        AND: [
          { jobs: { none: { scheduledAt: { gte: cutoff } } } },
        ],
      },
      orderBy: { name: "asc" },
      take: 3,
      include: { jobs: { orderBy: { scheduledAt: "desc" }, take: 1 } },
    });

    for (const customer of lapsedCustomers) {
      const lastJob = customer.jobs[0];
      suggestions.push({
        id: `lapsed-${customer.id}`,
        title: `This week looks quiet — worth calling ${customer.name}?`,
        description: lastJob
          ? `Last job was ${lastJob.scheduledAt.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}.`
          : "Hasn't had a job scheduled in a while.",
        href: `/calendar/jobs/new?customerId=${customer.id}`,
        cta: "Schedule a job",
      });
    }
  }

  const overdueCount = outstandingInvoices.filter(
    (inv) => inv.dueDate && inv.dueDate.getTime() < now.getTime(),
  ).length;
  if (overdueCount > 0) {
    suggestions.push({
      id: "overdue-invoices",
      title: `${overdueCount} invoice${overdueCount === 1 ? " is" : "s are"} overdue`,
      description: "Might be worth a reminder to get paid.",
      href: "/money/invoices",
      cta: "View invoices",
    });
  }

  const staleQuotes = quotesAwaitingAction.filter(
    (q) => q.status === "SENT" && now.getTime() - q.createdAt.getTime() > QUOTE_FOLLOWUP_DAYS * 24 * 60 * 60 * 1000,
  );
  if (staleQuotes.length > 0) {
    const first = staleQuotes[0];
    suggestions.push({
      id: `stale-quote-${first.id}`,
      title: `Follow up ${first.customer.name}'s quote?`,
      description: `"${first.description}" was sent over ${QUOTE_FOLLOWUP_DAYS} days ago with no response.`,
      href: `/money/quotes/${first.id}`,
      cta: "View quote",
    });
  }

  return suggestions;
}
