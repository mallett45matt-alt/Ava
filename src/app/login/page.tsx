import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { FieldGroup, Input, Label } from "@/components/ui/Field";
import { logIn } from "@/server/auth/actions";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-semibold">
          Ava
        </Link>
        <h1 className="mb-1 text-2xl font-semibold">Welcome back</h1>
        <p className="mb-6 text-sm text-muted">Log in to your business.</p>

        <AuthForm action={logIn} submitLabel="Log in" pendingLabel="Logging in…">
          <FieldGroup>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </FieldGroup>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-muted">
          New to Ava?{" "}
          <Link href="/signup" className="font-medium text-accent">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
