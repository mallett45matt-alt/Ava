"use client";

import { ActionForm } from "@/components/forms/ActionForm";
import { FieldError, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createTask } from "@/server/data/tasks-actions";

export function QuickAddTask({ customers }: { customers: { id: string; name: string }[] }) {
  return (
    <ActionForm action={createTask} className="space-y-2">
      {({ pending, error }) => (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input name="title" placeholder="Add a task…" className="flex-1" required />
            <div className="flex gap-2">
              <Input name="dueDate" type="date" className="w-full sm:w-40" />
              <Select name="priority" defaultValue="MEDIUM" className="w-full sm:w-32">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
          </div>
          {customers.length > 0 && (
            <Select name="customerId" defaultValue="" className="sm:w-64">
              <option value="">No customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
          <FieldError>{error}</FieldError>
          <Button type="submit" variant="secondary" size="sm" disabled={pending}>
            {pending ? "Adding…" : "Add task"}
          </Button>
        </>
      )}
    </ActionForm>
  );
}
