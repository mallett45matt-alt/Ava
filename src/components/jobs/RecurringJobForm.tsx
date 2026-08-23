"use client";

import { ActionForm, type FormState } from "@/components/forms/ActionForm";
import { FieldError, FieldGroup, Input, Label, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "Full day", value: 480 },
];

export function RecurringJobForm({
  action,
  customers,
  staff,
  defaultCustomerId,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  customers: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  defaultCustomerId?: string;
}) {
  const today = todayDateInputValue();

  return (
    <ActionForm action={action} className="space-y-4">
      {({ pending, error }) => (
        <>
          <FieldGroup>
            <Label htmlFor="customerId">Customer</Label>
            <Select id="customerId" name="customerId" defaultValue={defaultCustomerId} required>
              <option value="">Choose a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="description">Job description</Label>
            <Input id="description" name="description" placeholder="Lawn mowing & edges" required />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="address">Address (optional — defaults to the customer&apos;s)</Label>
            <Input id="address" name="address" />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Label htmlFor="intervalValue">Repeats every</Label>
              <Input id="intervalValue" name="intervalValue" type="number" min={1} max={52} defaultValue={3} required />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="intervalUnit">&nbsp;</Label>
              <Select id="intervalUnit" name="intervalUnit" defaultValue="WEEK">
                <option value="DAY">Day(s)</option>
                <option value="WEEK">Week(s)</option>
                <option value="MONTH">Month(s)</option>
              </Select>
            </FieldGroup>
          </div>

          <FieldGroup>
            <Label htmlFor="startDate">Starting from</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Label htmlFor="durationMin">Duration</Label>
              <Select id="durationMin" name="durationMin" defaultValue={60}>
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="price">Price (optional)</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" placeholder="0.00" />
            </FieldGroup>
          </div>

          <FieldGroup>
            <Label htmlFor="assignedStaffId">Assigned to (optional)</Label>
            <Select id="assignedStaffId" name="assignedStaffId">
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldError>{error}</FieldError>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create recurring job"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
