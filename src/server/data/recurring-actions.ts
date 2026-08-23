"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { ensureRecurringJobsGenerated } from "@/server/data/recurring";
import { dollarsToCents } from "@/lib/format";
import type { FormState } from "@/components/forms/ActionForm";

const recurringSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  description: z.string().trim().min(1, "Describe the job."),
  address: z.string().trim().optional(),
  durationMin: z.coerce.number().int().positive(),
  assignedStaffId: z.string().optional(),
  price: z.string().optional(),
  intervalValue: z.coerce.number().int().min(1).max(52),
  intervalUnit: z.enum(["DAY", "WEEK", "MONTH"]),
  startDate: z.string().min(1, "Choose a start date."),
});

export async function createRecurringJob(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = recurringSchema.safeParse({
    customerId: formData.get("customerId"),
    description: formData.get("description"),
    address: formData.get("address"),
    durationMin: formData.get("durationMin"),
    assignedStaffId: formData.get("assignedStaffId"),
    price: formData.get("price"),
    intervalValue: formData.get("intervalValue"),
    intervalUnit: formData.get("intervalUnit"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, businessId: session.businessId },
  });
  if (!customer) return { error: "Choose a valid customer." };

  const priceCents =
    parsed.data.price && parsed.data.price.trim() !== ""
      ? dollarsToCents(Number(parsed.data.price))
      : null;

  await prisma.recurringJob.create({
    data: {
      businessId: session.businessId,
      customerId: parsed.data.customerId,
      description: parsed.data.description,
      address: parsed.data.address || customer.address || null,
      estimatedDurationMin: parsed.data.durationMin,
      assignedStaffId: parsed.data.assignedStaffId || null,
      priceCents,
      intervalValue: parsed.data.intervalValue,
      intervalUnit: parsed.data.intervalUnit,
      startDate: new Date(`${parsed.data.startDate}T09:00:00`),
    },
  });

  await ensureRecurringJobsGenerated();

  revalidatePath("/calendar");
  redirect("/calendar/recurring");
}

export async function setRecurringActive(recurringJobId: string, active: boolean) {
  const session = await requireSession();
  await prisma.recurringJob.updateMany({
    where: { id: recurringJobId, businessId: session.businessId },
    data: { active },
  });
  if (active) await ensureRecurringJobsGenerated();
  revalidatePath("/calendar/recurring");
  revalidatePath("/calendar");
}
