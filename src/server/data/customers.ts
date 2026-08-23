import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

export async function listCustomers(query?: string) {
  const session = await requireSession();
  const q = query?.trim();

  return prisma.customer.findMany({
    where: {
      businessId: session.businessId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { address: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { jobs: true } },
    },
  });
}

export async function getCustomer(id: string) {
  const session = await requireSession();
  return prisma.customer.findFirst({
    where: { id, businessId: session.businessId },
    include: {
      jobs: { orderBy: { scheduledAt: "desc" }, include: { assignedStaff: true } },
      recurringJobs: { orderBy: { createdAt: "desc" }, include: { assignedStaff: true } },
      quotes: { orderBy: { createdAt: "desc" }, include: { items: true } },
      invoices: { orderBy: { createdAt: "desc" }, include: { items: true } },
      tasks: { orderBy: { createdAt: "desc" } },
    },
  });
}
