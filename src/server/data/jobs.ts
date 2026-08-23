import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

export async function listJobsInRange(start: Date, end: Date) {
  const session = await requireSession();
  return prisma.job.findMany({
    where: {
      businessId: session.businessId,
      scheduledAt: { gte: start, lte: end },
    },
    orderBy: { scheduledAt: "asc" },
    include: { customer: true, assignedStaff: true },
  });
}

export async function getJob(id: string) {
  const session = await requireSession();
  return prisma.job.findFirst({
    where: { id, businessId: session.businessId },
    include: {
      customer: true,
      assignedStaff: true,
      recurringJob: true,
      invoices: true,
    },
  });
}
