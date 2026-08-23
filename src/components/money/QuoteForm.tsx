"use client";

import { ActionForm, type FormState } from "@/components/forms/ActionForm";
import { FieldError, FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LineItemsEditor } from "@/components/money/LineItemsEditor";

export function QuoteForm({
  action,
  customers,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  customers: { id: string; name: string }[];
  defaults?: {
    customerId?: string;
    description?: string;
    notes?: string;
    items?: { description: string; quantity: number; unitPriceCents: number }[];
  };
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      {({ pending, error }) => (
        <>
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
            <Label htmlFor="description">What&apos;s the quote for?</Label>
            <Input
              id="description"
              name="description"
              placeholder="Front yard garden makeover"
              defaultValue={defaults?.description}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Line items</Label>
            <LineItemsEditor defaultItems={defaults?.items} />
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
