"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import type { FormState } from "@/components/forms/ActionForm";

const taskSchema = z.object({
  title: z.string().trim().min(1, "Enter a task."),
  notes: z.string().trim().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  customerId: z.string().optional(),
});

export async function createTask(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  // formData.get() returns null (not undefined) for a field that isn't in
  // the form at all — the quick-add form omits notes, and only renders the
  // customer picker when the business has at least one customer — and
  // Zod's .optional() only accepts undefined, not null.
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") ?? undefined,
    dueDate: formData.get("dueDate") ?? undefined,
    priority: formData.get("priority") || "MEDIUM",
    customerId: formData.get("customerId") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const customerId = parsed.data.customerId || undefined;
  if (customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId: session.businessId },
    });
    if (!customer) return { error: "Choose a valid customer." };
  }

  await prisma.task.create({
    data: {
      businessId: session.businessId,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00`) : null,
      priority: parsed.data.priority as TaskPriority,
      customerId: customerId ?? null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return null;
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const session = await requireSession();
  await prisma.task.updateMany({
    where: { id: taskId, businessId: session.businessId },
    data: { status },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
