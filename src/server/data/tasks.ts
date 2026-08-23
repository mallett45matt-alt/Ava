import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

export async function listOpenTasks() {
  const session = await requireSession();
  return prisma.task.findMany({
    where: { businessId: session.businessId, status: "OPEN" },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { priority: "desc" }, { createdAt: "asc" }],
    include: { customer: true, job: true },
  });
}

export async function listRecentlyDoneTasks(limit = 20) {
  const session = await requireSession();
  return prisma.task.findMany({
    where: { businessId: session.businessId, status: "DONE" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { customer: true, job: true },
  });
}
