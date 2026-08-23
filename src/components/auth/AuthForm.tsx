"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { AuthActionState } from "@/server/auth/actions";

export function AuthForm({
  action,
  children,
  submitLabel,
  pendingLabel,
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
