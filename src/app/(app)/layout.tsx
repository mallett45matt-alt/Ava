import { requireSession } from "@/server/auth/require";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell businessName={session.businessName} userName={session.name}>
      {children}
    </AppShell>
  );
}
