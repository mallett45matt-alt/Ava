import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

export async function listInvoices() {
  const session = await requireSession();
  return prisma.invoice.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });
}

export async function getInvoice(id: string) {
  const session = await requireSession();
  return prisma.invoice.findFirst({
    where: { id, businessId: session.businessId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: "asc" } },
      job: true,
      quote: true,
    },
  });
}

/**
 * Self-heals invoice status the same way ensureRecurringJobsGenerated()
 * tops up the calendar: any invoice that's been sent and is now past its
 * due date gets flipped to OVERDUE, without the owner having to remember
 * to do it by hand.
 */
export async function markOverdueInvoices() {
  const session = await requireSession();
  await prisma.invoice.updateMany({
    where: {
      businessId: session.businessId,
      status: "SENT",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });
}

/** Jobs that are done and don't have an invoice yet — candidates to bill. */
export async function listUninvoicedCompletedJobs() {
  const session = await requireSession();
  return prisma.job.findMany({
    where: { businessId: session.businessId, status: "COMPLETED", invoices: { none: {} } },
    orderBy: { scheduledAt: "desc" },
    include: { customer: true },
  });
}
