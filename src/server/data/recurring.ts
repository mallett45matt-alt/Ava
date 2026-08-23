import "server-only";

import type { RecurrenceUnit } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";

const GENERATION_HORIZON_DAYS = 90;
const MAX_OCCURRENCES_PER_RUN = 26;

export function addInterval(date: Date, unit: RecurrenceUnit, value: number): Date {
  const d = new Date(date);
  if (unit === "DAY") d.setDate(d.getDate() + value);
  else if (unit === "WEEK") d.setDate(d.getDate() + value * 7);
  else d.setMonth(d.getMonth() + value); // MONTH — simple calendar-month arithmetic
  return d;
}

/**
 * Tops up generated Job rows for every active recurring job template, up to
 * ~90 days out. There's no background job runner in V1, so instead this is
 * idempotent and cheap (a no-op once a business is already topped up) and
 * gets called whenever the calendar, dashboard, or Ava loads jobs — the app
 * "self-heals" the schedule on every visit rather than needing a cron job.
 */
export async function ensureRecurringJobsGenerated() {
  const session = await requireSession();
  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + GENERATION_HORIZON_DAYS);

  const templates = await prisma.recurringJob.findMany({
    where: { businessId: session.businessId, active: true },
  });

  for (const template of templates) {
    if (template.endDate && template.endDate < now) continue;

    let cursor = template.lastGeneratedDate
      ? addInterval(template.lastGeneratedDate, template.intervalUnit, template.intervalValue)
      : template.startDate;

    const occurrences: Date[] = [];
    while (
      cursor <= horizon &&
      (!template.endDate || cursor <= template.endDate) &&
      occurrences.length < MAX_OCCURRENCES_PER_RUN
    ) {
      occurrences.push(new Date(cursor));
      cursor = addInterval(cursor, template.intervalUnit, template.intervalValue);
    }

    if (occurrences.length === 0) continue;

    await prisma.$transaction([
      prisma.job.createMany({
        data: occurrences.map((scheduledAt) => ({
          businessId: template.businessId,
          customerId: template.customerId,
          address: template.address,
          scheduledAt,
          estimatedDurationMin: template.estimatedDurationMin,
          description: template.description,
          assignedStaffId: template.assignedStaffId,
          priceCents: template.priceCents,
          recurringJobId: template.id,
        })),
      }),
      prisma.recurringJob.update({
        where: { id: template.id },
        data: { lastGeneratedDate: occurrences[occurrences.length - 1] },
      }),
    ]);
  }
}

export async function listRecurringJobs() {
  const session = await requireSession();
  return prisma.recurringJob.findMany({
    where: { businessId: session.businessId },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    include: { customer: true, assignedStaff: true },
  });
}
