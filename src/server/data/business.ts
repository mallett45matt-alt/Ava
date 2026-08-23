"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { setSessionCookie } from "@/server/auth/session";
import type { FormState } from "@/components/forms/ActionForm";

const businessNameSchema = z.object({
  businessName: z.string().trim().min(2, "Enter a business name."),
});

export async function updateBusinessName(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = businessNameSchema.safeParse({ businessName: formData.get("businessName") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a business name." };
  }

  await prisma.business.update({
    where: { id: session.businessId },
    data: { name: parsed.data.businessName },
  });

  // The session cookie caches the business name for fast page loads, so it
  // needs refreshing whenever the name changes.
  await setSessionCookie({ ...session, businessName: parsed.data.businessName });
  revalidatePath("/settings");
  return null;
}
