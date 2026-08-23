import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { FieldGroup, Input, Label } from "@/components/ui/Field";
import { signUp } from "@/server/auth/actions";

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-semibold">
          Ava
        </Link>
        <h1 className="mb-1 text-2xl font-semibold">Set up your business</h1>
        <p className="mb-6 text-sm text-muted">Takes about a minute. No credit card.</p>

        <AuthForm action={signUp} submitLabel="Create account" pendingLabel="Creating account…">
          <FieldGroup>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" name="businessName" placeholder="Green Edge Landscaping" required />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </FieldGroup>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </FieldGroup>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
