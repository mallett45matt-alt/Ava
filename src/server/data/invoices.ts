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

/** Jobs that are done and don't have an invoice yet — candidates to bill. */
export async function listUninvoicedCompletedJobs() {
  const session = await requireSession();
  return prisma.job.findMany({
    where: { businessId: session.businessId, status: "COMPLETED", invoices: { none: {} } },
    orderBy: { scheduledAt: "desc" },
    include: { customer: true },
  });
}
