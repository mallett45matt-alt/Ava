import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

export async function listQuotes() {
  const session = await requireSession();
  return prisma.quote.findMany({
    where: { businessId: session.businessId },
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });
}

export async function getQuote(id: string) {
  const session = await requireSession();
  return prisma.quote.findFirst({
    where: { id, businessId: session.businessId },
    include: { customer: true, items: { orderBy: { sortOrder: "asc" } }, invoices: true },
  });
}
