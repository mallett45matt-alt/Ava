import "server-only";

import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

export async function listStaff() {
  const session = await requireSession();
  return prisma.staffMember.findMany({
    where: { businessId: session.businessId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function listActiveStaff() {
  const session = await requireSession();
  return prisma.staffMember.findMany({
    where: { businessId: session.businessId, active: true },
    orderBy: { name: "asc" },
  });
}
