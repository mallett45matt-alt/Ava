"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/auth/require";
import { parseLineItems } from "@/server/data/line-items";
import type { FormState } from "@/components/forms/ActionForm";

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  jobId: z.string().optional(),
  quoteId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

function parseInvoiceForm(formData: FormData) {
  // formData.get() returns null (not undefined) for a field that isn't in
  // the form at all — the hidden jobId/quoteId inputs are only rendered
  // when relevant — and Zod's .optional() only accepts undefined, not null.
  return invoiceSchema.safeParse({
    customerId: formData.get("customerId"),
    jobId: formData.get("jobId") ?? undefined,
    quoteId: formData.get("quoteId") ?? undefined,
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes"),
  });
}

export async function createInvoice(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, businessId: session.businessId },
  });
  if (!customer) return { error: "Choose a valid customer." };

  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  const invoice = await prisma.invoice.create({
    data: {
      businessId: session.businessId,
      customerId: parsed.data.customerId,
      jobId: parsed.data.jobId || null,
      quoteId: parsed.data.quoteId || null,
      dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00`) : null,
      notes: parsed.data.notes || null,
      items: { create: items },
    },
  });

  revalidatePath("/money/invoices");
  revalidatePath(`/customers/${parsed.data.customerId}`);
  if (parsed.data.jobId) revalidatePath(`/calendar/jobs/${parsed.data.jobId}`);
  redirect(`/money/invoices/${invoice.id}`);
}

export async function updateInvoice(
  invoiceId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId: session.businessId },
  });
  if (!existing) return { error: "Invoice not found." };

  const items = parseLineItems(formData);
  if (items.length === 0) return { error: "Add at least one line item." };

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoiceId } }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        customerId: parsed.data.customerId,
        dueDate: parsed.data.dueDate ? new Date(`${parsed.data.dueDate}T00:00:00`) : null,
        notes: parsed.data.notes || null,
        items: { create: items },
      },
    }),
  ]);

  revalidatePath("/money/invoices");
  revalidatePath(`/money/invoices/${invoiceId}`);
  redirect(`/money/invoices/${invoiceId}`);
}

export async function setInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const session = await requireSession();
  await prisma.invoice.updateMany({
    where: { id: invoiceId, businessId: session.businessId },
    data: { status },
  });
  revalidatePath("/money/invoices");
  revalidatePath(`/money/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
}
