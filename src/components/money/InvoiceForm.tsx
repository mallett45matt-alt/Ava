"use client";

import { ActionForm, type FormState } from "@/components/forms/ActionForm";
import { FieldError, FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor } from "@/components/money/LineItemsEditor";

export function InvoiceForm({
  action,
  customers,
  jobId,
  quoteId,
  linkedContext,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  customers: { id: string; name: string }[];
  jobId?: string;
  quoteId?: string;
  linkedContext?: string;
  defaults?: {
    customerId?: string;
    dueDate?: string;
    notes?: string;
    items?: { description: string; quantity: number; unitPriceCents: number }[];
  };
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      {({ pending, error }) => (
        <>
          {jobId && <input type="hidden" name="jobId" value={jobId} />}
          {quoteId && <input type="hidden" name="quoteId" value={quoteId} />}

          {linkedContext && (
            <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-accent">
              {linkedContext}
            </p>
          )}

          <FieldGroup>
            <Label htmlFor="customerId">Customer</Label>
            <Select id="customerId" name="customerId" defaultValue={defaults?.customerId} required>
              <option value="">Choose a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Line items</Label>
            <LineItemsEditor defaultItems={defaults?.items} />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="dueDate">Due date (optional)</Label>
            <Input id="dueDate" name="dueDate" type="date" defaultValue={defaults?.dueDate} />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={defaults?.notes} />
          </FieldGroup>

          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
