import Link from "next/link";
import { Settings } from "lucide-react";
import { SidebarNav, BottomNav } from "./NavLink";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  businessName,
  userName,
  children,
}: {
  businessName: string;
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-4 md:flex">
        <div className="mb-6 px-2 pt-2">
          <p className="text-lg font-semibold tracking-tight">Ava</p>
          <p className="mt-0.5 truncate text-sm text-muted">{businessName}</p>
        </div>
        <SidebarNav />
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-black/5 dark:hover:bg-white/5"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {initials(userName)}
          </span>
          Settings
        </Link>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div>
            <p className="text-sm font-semibold leading-tight">Ava</p>
            <p className="truncate text-xs text-muted">{businessName}</p>
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent"
          >
            <Settings size={18} />
          </Link>
        </header>

        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
