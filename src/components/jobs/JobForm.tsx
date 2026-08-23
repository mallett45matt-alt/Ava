"use client";

import { ActionForm, type FormState } from "@/components/forms/ActionForm";
import { FieldError, FieldGroup, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "Full day", value: 480 },
];

export type JobDefaults = {
  customerId: string;
  description: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMin: number;
  assignedStaffId: string;
  price: string;
  internalNotes: string;
};

export function JobForm({
  action,
  customers,
  staff,
  defaults,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  customers: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  defaults?: Partial<JobDefaults>;
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
            <Label htmlFor="description">Job description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Mow & edges, garden tidy-up…"
              defaultValue={defaults?.description}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="address">Address (optional — defaults to the customer&apos;s)</Label>
            <Input id="address" name="address" defaultValue={defaults?.address} />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Label htmlFor="scheduledDate">Date</Label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                defaultValue={defaults?.scheduledDate}
                required
              />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="scheduledTime">Start time</Label>
              <Input
                id="scheduledTime"
                name="scheduledTime"
                type="time"
                defaultValue={defaults?.scheduledTime ?? "09:00"}
                required
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Label htmlFor="durationMin">Duration</Label>
              <Select id="durationMin" name="durationMin" defaultValue={defaults?.durationMin ?? 60}>
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={defaults?.price}
              />
            </FieldGroup>
          </div>

          <FieldGroup>
            <Label htmlFor="assignedStaffId">Assigned to (optional)</Label>
            <Select id="assignedStaffId" name="assignedStaffId" defaultValue={defaults?.assignedStaffId}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="internalNotes">Internal notes (optional)</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              placeholder="Not visible to the customer…"
              defaultValue={defaults?.internalNotes}
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
