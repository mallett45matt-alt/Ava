"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QuoteStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { parseLineItems } from "@/server/data/line-items";
import type { FormState } from "@/components/forms/ActionForm";

const quoteSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  description: z.string().trim().min(1, "Describe the job."),
  notes: z.string().trim().optional(),
});

function parseQuoteForm(formData: FormData) {
  return quoteSchema.safeParse({
    customerId: formData.get("customerId"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });
}

export async function createQuote(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseQuoteForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, businessId: session.businessId },
  });
  if (!customer) return { error: "Choose a valid customer." };

  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  const quote = await prisma.quote.create({
    data: {
      businessId: session.businessId,
      customerId: parsed.data.customerId,
      description: parsed.data.description,
      notes: parsed.data.notes || null,
      items: { create: items },
    },
  });

  revalidatePath("/money/quotes");
  revalidatePath(`/customers/${parsed.data.customerId}`);
  redirect(`/money/quotes/${quote.id}`);
}

export async function updateQuote(
  quoteId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseQuoteForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, businessId: session.businessId },
  });
  if (!existing) return { error: "Quote not found." };

  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  await prisma.$transaction([
    prisma.quoteItem.deleteMany({ where: { quoteId } }),
    prisma.quote.update({
      where: { id: quoteId },
      data: {
        customerId: parsed.data.customerId,
        description: parsed.data.description,
        notes: parsed.data.notes || null,
        items: { create: items },
      },
    }),
  ]);

  revalidatePath("/money/quotes");
  revalidatePath(`/money/quotes/${quoteId}`);
  redirect(`/money/quotes/${quoteId}`);
}

export async function setQuoteStatus(quoteId: string, status: QuoteStatus) {
  const session = await requireSession();
  await prisma.quote.updateMany({
    where: { id: quoteId, businessId: session.businessId },
    data: { status },
  });
  revalidatePath("/money/quotes");
  revalidatePath(`/money/quotes/${quoteId}`);
  revalidatePath("/dashboard");
}
