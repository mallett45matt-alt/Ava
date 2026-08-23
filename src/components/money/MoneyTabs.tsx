import Link from "next/link";
import { cn } from "@/lib/utils";

export function MoneyTabs({ active }: { active: "quotes" | "invoices" }) {
  return (
    <div className="mb-5 inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      {(["quotes", "invoices"] as const).map((tab) => (
        <Link
          key={tab}
          href={`/money/${tab}`}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
            tab === active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground",
          )}
        >
          {tab}
        </Link>
      ))}
    </div>
  );
}
