"use client";

import { useActionState, useRef } from "react";

export type FormState = { error: string } | null;

/**
 * Thin wrapper around React's useActionState for our Server Actions, all of
 * which follow the same `(prevState, formData) => { error } | null` shape.
 * Children are a render-prop so each form can lay out its own fields while
 * sharing the pending/error plumbing.
 */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  children: (opts: { pending: boolean; error?: string | null }) => React.ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result === null) {
      formRef.current?.reset();
      onSuccess?.();
    }
    return result;
  }, null);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children({ pending, error: state?.error })}
    </form>
  );
}
