"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { JobStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { dollarsToCents } from "@/lib/format";
import type { FormState } from "@/components/forms/ActionForm";

const jobSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  description: z.string().trim().min(1, "Describe the job."),
  address: z.string().trim().optional(),
  scheduledDate: z.string().min(1, "Choose a date."),
  scheduledTime: z.string().min(1, "Choose a time."),
  durationMin: z.coerce.number().int().positive(),
  assignedStaffId: z.string().optional(),
  price: z.string().optional(),
  internalNotes: z.string().trim().optional(),
});

function parseJobForm(formData: FormData) {
  return jobSchema.safeParse({
    customerId: formData.get("customerId"),
    description: formData.get("description"),
    address: formData.get("address"),
    scheduledDate: formData.get("scheduledDate"),
    scheduledTime: formData.get("scheduledTime"),
    durationMin: formData.get("durationMin"),
    assignedStaffId: formData.get("assignedStaffId"),
    price: formData.get("price"),
    internalNotes: formData.get("internalNotes"),
  });
}

export async function createJob(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseJobForm(formData);
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

  const job = await prisma.job.create({
    data: {
      businessId: session.businessId,
      customerId: parsed.data.customerId,
      description: parsed.data.description,
      address: parsed.data.address || customer.address || null,
      scheduledAt: new Date(`${parsed.data.scheduledDate}T${parsed.data.scheduledTime}:00`),
      estimatedDurationMin: parsed.data.durationMin,
      assignedStaffId: parsed.data.assignedStaffId || null,
      priceCents,
      internalNotes: parsed.data.internalNotes || null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath(`/customers/${parsed.data.customerId}`);
  redirect(`/calendar/jobs/${job.id}`);
}

export async function updateJob(
  jobId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseJobForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const existing = await prisma.job.findFirst({
    where: { id: jobId, businessId: session.businessId },
  });
  if (!existing) return { error: "Job not found." };

  const priceCents =
    parsed.data.price && parsed.data.price.trim() !== ""
      ? dollarsToCents(Number(parsed.data.price))
      : null;

  await prisma.job.update({
    where: { id: jobId },
    data: {
      customerId: parsed.data.customerId,
      description: parsed.data.description,
      address: parsed.data.address || null,
      scheduledAt: new Date(`${parsed.data.scheduledDate}T${parsed.data.scheduledTime}:00`),
      estimatedDurationMin: parsed.data.durationMin,
      assignedStaffId: parsed.data.assignedStaffId || null,
      priceCents,
      internalNotes: parsed.data.internalNotes || null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath(`/calendar/jobs/${jobId}`);
  redirect(`/calendar/jobs/${jobId}`);
}

export async function setJobStatus(jobId: string, status: JobStatus) {
  const session = await requireSession();
  await prisma.job.updateMany({
    where: { id: jobId, businessId: session.businessId },
    data: { status },
  });
  revalidatePath("/calendar");
  revalidatePath(`/calendar/jobs/${jobId}`);
  revalidatePath("/dashboard");
}
