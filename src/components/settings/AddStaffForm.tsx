"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { FieldError, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createStaffMember } from "@/server/data/staff-actions";

export function AddStaffForm() {
  return (
    <ActionForm action={createStaffMember} className="space-y-3 border-t border-border pt-4">
      {({ pending, error }) => (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input name="name" placeholder="Name" required />
            <Input name="phone" placeholder="Phone (optional)" />
            <Input name="email" type="email" placeholder="Email (optional)" />
          </div>
          <FieldError>{error}</FieldError>
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? "Adding…" : "Add staff member"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
