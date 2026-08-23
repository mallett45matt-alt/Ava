"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import type { FormState } from "@/components/forms/ActionForm";

const staffSchema = z.object({
  name: z.string().trim().min(1, "Enter a name."),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
});

export async function createStaffMember(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  await prisma.staffMember.create({
    data: {
      businessId: session.businessId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
    },
  });

  revalidatePath("/settings");
  return null;
}

export async function setStaffActive(staffId: string, active: boolean) {
  const session = await requireSession();
  // Scoping the update by businessId (not just id) means a staffId from a
  // different business simply matches zero rows instead of leaking access.
  await prisma.staffMember.updateMany({
    where: { id: staffId, businessId: session.businessId },
    data: { active },
  });
  revalidatePath("/settings");
}
