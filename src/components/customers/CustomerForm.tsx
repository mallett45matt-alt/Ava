"use client";

import { ActionForm, type FormState } from "@/components/forms/ActionForm";
import { FieldError, FieldGroup, Input, Label, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export type CustomerDefaults = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export function CustomerForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Partial<CustomerDefaults>;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="space-y-4">
      {({ pending, error }) => (
        <>
          <FieldGroup>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={defaults?.name} required />
          </FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={defaults?.phone} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={defaults?.email} />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={defaults?.address} />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Gate code, dog in the yard, access notes…"
              defaultValue={defaults?.notes}
            />
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
