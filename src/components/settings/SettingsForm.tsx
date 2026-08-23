"use client";

import { ActionForm, type FormState } from "@/components/forms/ActionForm";
import { FieldError, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function SettingsForm({
  action,
  defaultValue,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValue: string;
}) {
  return (
    <ActionForm action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      {({ pending, error }) => (
        <>
          <div className="flex-1">
            <Input name="businessName" defaultValue={defaultValue} required />
            <FieldError>{error}</FieldError>
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
